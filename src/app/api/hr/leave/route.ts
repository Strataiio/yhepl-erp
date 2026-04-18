/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('leave_applications')
    .select('*, employees(full_name, employee_code, departments(name))')
    .order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const body = await req.json()
  const { data, error } = await (adminDB() as any).from('leave_applications').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const { id, ...updates } = body
  const finalUpdates: any = { ...updates }
  if (updates.status === 'approved' || updates.status === 'rejected') {
    finalUpdates.approved_by = user.id
    finalUpdates.approved_at = new Date().toISOString()
  }
  const { data, error } = await (adminDB() as any).from('leave_applications').update(finalUpdates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
