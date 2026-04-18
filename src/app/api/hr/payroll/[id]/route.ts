/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireUser()) return unauth()
  const { id } = await params
  const { data, error } = await (adminDB() as any)
    .from('payroll_line_items')
    .select('*, employees(full_name, employee_code, bank_account, bank_ifsc, bank_name, departments(name), designations(name))')
    .eq('payroll_run_id', id)
    .order('employees(full_name)')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauth()
  const { id } = await params
  const body = await req.json()
  const db = adminDB() as any
  const updates: any = { ...body }
  if (body.status === 'approved') { updates.approved_by = user.id; updates.approved_at = new Date().toISOString() }
  const { data, error } = await db.from('payroll_runs').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
