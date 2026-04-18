/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM
  const employeeId = searchParams.get('employee_id')
  const db = adminDB() as any
  let q = db.from('attendance')
    .select('*, employees(full_name, employee_code, departments(name))')
    .order('attendance_date', { ascending: false })
  if (month) {
    q = q.gte('attendance_date', `${month}-01`).lte('attendance_date', `${month}-31`)
  }
  if (employeeId) q = q.eq('employee_id', employeeId)
  const { data, error } = await q.limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any

  if (Array.isArray(body)) {
    // Bulk insert for monthly attendance
    const { data, error } = await db.from('attendance').upsert(
      body.map((r: any) => ({ ...r, approved_by: user.id })),
      { onConflict: 'employee_id,attendance_date' }
    ).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Calculate working hours
  let workingHours = null
  let otHours = 0
  if (body.in_time && body.out_time) {
    const diff = (new Date(body.out_time).getTime() - new Date(body.in_time).getTime()) / 3600000
    workingHours = Math.round(diff * 10) / 10
    otHours = Math.max(0, Math.round((workingHours - 8) * 10) / 10)
  }

  const { data, error } = await db.from('attendance').upsert(
    { ...body, working_hours: workingHours, ot_hours: otHours, approved_by: user.id },
    { onConflict: 'employee_id,attendance_date' }
  ).select('*, employees(full_name, employee_code)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
