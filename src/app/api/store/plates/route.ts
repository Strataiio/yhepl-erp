/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('plates')
    .select('*, material_grades(code, name, standard), vendors(name, code), stock_locations(name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  // Generate QR code value
  const qrCode = `PLT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  const payload = {
    ...body,
    qr_code: qrCode,
    available_area_sqmm: body.original_length_mm * body.original_width_mm,
    available_length_mm: body.original_length_mm,
    available_width_mm: body.original_width_mm,
    current_weight_kg: body.original_weight_kg,
    status: 'available',
    created_by: user.id,
  }
  const { data, error } = await (adminDB() as any)
    .from('plates').insert(payload)
    .select('*, material_grades(code, name), vendors(name), stock_locations(name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
