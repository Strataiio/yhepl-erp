/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireUser()) return unauth()
  const { id } = await params
  const { data, error } = await (adminDB() as any).from('employees')
    .select('*, departments(name), designations(name, default_wage_rate_per_hr), wage_structures(*)')
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireUser()) return unauth()
  const { id } = await params
  const body = await req.json()
  const { data, error } = await (adminDB() as any).from('employees').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
