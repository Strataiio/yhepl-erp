/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('payroll_runs')
    .select('*, payroll_line_items(count)')
    .order('year', { ascending: false }).order('month', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  // body: { month: number, year: number }
  const db = adminDB() as any
  const period = `${body.year}-${String(body.month).padStart(2, '0')}`

  // Check existing
  const existing = await db.from('payroll_runs').select('id').eq('payroll_period', period).single()
  if (existing.data) return NextResponse.json({ error: 'Payroll already exists for this period' }, { status: 400 })

  // Get all active employees with wage structures
  const { data: employees } = await db.from('employees')
    .select('*, wage_structures(*), designations(default_wage_rate_per_hr)')
    .eq('is_active', true)

  if (!employees?.length) return NextResponse.json({ error: 'No active employees found' }, { status: 400 })

  // Get attendance for the period
  const { data: attendance } = await db.from('attendance')
    .select('*')
    .gte('attendance_date', `${period}-01`)
    .lte('attendance_date', `${period}-31`)

  const attMap: Record<string, any[]> = {}
  ;(attendance || []).forEach((a: any) => {
    if (!attMap[a.employee_id]) attMap[a.employee_id] = []
    attMap[a.employee_id].push(a)
  })

  // Compute line items
  const lineItems: any[] = []
  let totalGross = 0, totalPFEmp = 0, totalPFEmr = 0, totalESICEmp = 0, totalESICEmr = 0, totalNet = 0

  for (const emp of employees) {
    const ws = emp.wage_structures?.find((w: any) => !w.effective_to || new Date(w.effective_to) >= new Date()) || emp.wage_structures?.[0]
    const empAtt = attMap[emp.id] || []
    const presentDays = empAtt.filter((a: any) => ['present', 'half_day'].includes(a.status)).length
      + empAtt.filter((a: any) => a.status === 'half_day').length * -0.5
    const lopDays = empAtt.filter((a: any) => a.status === 'leave' && true).length
    const otHours = empAtt.reduce((s: number, a: any) => s + (a.ot_hours || 0), 0)

    const basic = ws ? (ws.basic * (presentDays / 26)) : 0
    const da = ws ? (ws.da * (presentDays / 26)) : 0
    const hra = ws ? (ws.hra * (presentDays / 26)) : 0
    const conv = ws ? (ws.conveyance * (presentDays / 26)) : 0
    const special = ws ? (ws.special_allowance * (presentDays / 26)) : 0
    const otRate = ws ? ((ws.basic + ws.da) / 26 / 8 * 1.5) : 0
    const otAmt = Math.round(otHours * otRate * 100) / 100
    const grossEarnings = Math.round((basic + da + hra + conv + special + otAmt) * 100) / 100

    // PF: 12% on basic+DA, cap 15000
    const pfWage = Math.min(basic + da, 15000)
    const pfEmp = Math.round(pfWage * 0.12 * 100) / 100
    const pfEmr = Math.round(pfWage * 0.12 * 100) / 100
    // ESIC: 0.75% emp, 3.25% employer on gross <= 21000
    const esicEmp = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0075 * 100) / 100 : 0
    const esicEmr = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0325 * 100) / 100 : 0
    const totalDed = pfEmp + esicEmp
    const netPay = Math.round((grossEarnings - totalDed) * 100) / 100

    lineItems.push({
      employee_id: emp.id,
      present_days: Math.round(presentDays * 10) / 10,
      lop_days: lopDays,
      ot_hours: Math.round(otHours * 10) / 10,
      basic: Math.round(basic * 100) / 100,
      da: Math.round(da * 100) / 100,
      hra: Math.round(hra * 100) / 100,
      conveyance: Math.round(conv * 100) / 100,
      special_allowance: Math.round(special * 100) / 100,
      ot_amount: otAmt,
      gross_earnings: grossEarnings,
      pf_employee: pfEmp,
      pf_employer: pfEmr,
      esic_employee: esicEmp,
      esic_employer: esicEmr,
      tds: 0,
      advance_recovery: 0,
      other_deductions: 0,
      total_deductions: Math.round(totalDed * 100) / 100,
      net_payable: netPay,
    })

    totalGross += grossEarnings
    totalPFEmp += pfEmp; totalPFEmr += pfEmr
    totalESICEmp += esicEmp; totalESICEmr += esicEmr
    totalNet += netPay
  }

  // Create payroll run
  const { data: run, error: re } = await db.from('payroll_runs').insert({
    payroll_period: period,
    month: body.month,
    year: body.year,
    status: 'computed',
    total_gross: Math.round(totalGross * 100) / 100,
    total_pf_employee: Math.round(totalPFEmp * 100) / 100,
    total_pf_employer: Math.round(totalPFEmr * 100) / 100,
    total_esic_employee: Math.round(totalESICEmp * 100) / 100,
    total_esic_employer: Math.round(totalESICEmr * 100) / 100,
    total_tds: 0,
    total_advance_recovery: 0,
    total_net_payable: Math.round(totalNet * 100) / 100,
    created_by: user.id,
    zoho_sync_status: 'pending',
  }).select().single()
  if (re) return NextResponse.json({ error: re.message }, { status: 500 })

  // Insert line items
  await db.from('payroll_line_items').insert(lineItems.map(l => ({ ...l, payroll_run_id: run.id })))

  return NextResponse.json(run)
}
