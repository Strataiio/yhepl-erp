/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function admin() { return createAdminSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } }) }
async function getUser() { const s = await createServerClient(); const { data: { user } } = await s.auth.getUser(); return user }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data, error } = await (admin() as any)
    .from('labour_bucket_logs')
    .select('*, employees(full_name, employee_code, designation_id, designations(name))')
    .eq('bucket_id', id)
    .order('clock_in', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()

  // Get bucket project_id
  const bucketRes = await (admin() as any).from('buckets').select('project_id').eq('id', id).single()
  const projectId = bucketRes.data?.project_id

  if (body.action === 'clock_in') {
    const { data, error } = await (admin() as any)
      .from('labour_bucket_logs')
      .insert({ bucket_id: id, project_id: projectId, employee_id: body.employee_id, clock_in: new Date().toISOString() })
      .select('*, employees(full_name, employee_code)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (body.action === 'clock_out' && body.log_id) {
    const clockOut = new Date().toISOString()
    const startRes = await (admin() as any).from('labour_bucket_logs').select('clock_in, employee_id').eq('id', body.log_id).single()
    const hoursWorked = startRes.data
      ? Math.round(((new Date(clockOut).getTime() - new Date(startRes.data.clock_in).getTime()) / 3600000) * 10) / 10
      : null

    // Get rate
    let ratePerHour = 0
    if (startRes.data?.employee_id) {
      const empRes = await (admin() as any).from('employees').select('designation_id, designations(default_wage_rate_per_hr)').eq('id', startRes.data.employee_id).single()
      ratePerHour = empRes.data?.designations?.default_wage_rate_per_hr || 0
    }

    const costAmount = hoursWorked && ratePerHour ? Math.round(hoursWorked * ratePerHour * 100) / 100 : null

    const { data, error } = await (admin() as any)
      .from('labour_bucket_logs')
      .update({ clock_out: clockOut, hours_worked: hoursWorked, rate_per_hour: ratePerHour || null, cost_amount: costAmount })
      .eq('id', body.log_id)
      .select('*, employees(full_name, employee_code)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
