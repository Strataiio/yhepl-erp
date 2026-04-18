/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('employees')
    .select('*, departments(name, code), designations(name, default_wage_rate_per_hr)')
    .order('full_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any
  const empCode = `EMP-${String(Date.now()).slice(-4)}`
  const qrCode = `EMP-QR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  const { data, error } = await db.from('employees')
    .insert({ ...body, employee_code: empCode, qr_code: qrCode, created_by: user.id })
    .select('*, departments(name), designations(name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
