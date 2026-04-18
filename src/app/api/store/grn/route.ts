/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('grn')
    .select('*, vendors(name, code), grn_items(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any

  // Generate GRN number
  const grnNum = `GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const { data: grn, error: ge } = await db.from('grn').insert({
    grn_number: grnNum,
    vendor_id: body.vendor_id,
    grn_type: body.grn_type || 'plate',
    grn_date: body.grn_date || new Date().toISOString().split('T')[0],
    po_id: body.po_id || null,
    dc_number: body.dc_number || null,
    vehicle_number: body.vehicle_number || null,
    notes: body.notes || null,
    received_by: user.id,
    created_by: user.id,
  }).select().single()
  if (ge) return NextResponse.json({ error: ge.message }, { status: 500 })

  const plates: any[] = []

  // Process items
  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      // Insert GRN item
      const { data: grnItem } = await db.from('grn_items').insert({
        grn_id: grn.id,
        description: item.description,
        qty_received: item.qty_received,
        unit_rate: item.unit_rate || null,
        heat_number: item.heat_number || null,
        material_grade_id: item.material_grade_id || null,
        thickness_mm: item.thickness_mm || null,
        length_mm: item.length_mm || null,
        width_mm: item.width_mm || null,
        weight_kg: item.weight_kg || null,
        mtc_url: item.mtc_url || null,
      }).select().single()

      // Auto-create plate if plate GRN
      if (body.grn_type === 'plate' && item.heat_number) {
        const qrCode = `PLT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        const { data: plate } = await db.from('plates').insert({
          heat_number: item.heat_number,
          vendor_id: body.vendor_id,
          material_grade_id: item.material_grade_id,
          thickness_mm: item.thickness_mm,
          original_length_mm: item.length_mm,
          original_width_mm: item.width_mm,
          original_weight_kg: item.weight_kg,
          available_area_sqmm: item.length_mm * item.width_mm,
          available_length_mm: item.length_mm,
          available_width_mm: item.width_mm,
          current_weight_kg: item.weight_kg,
          location_id: item.location_id || null,
          status: 'available',
          qr_code: qrCode,
          mtc_document_url: item.mtc_url || null,
          grn_id: grn.id,
          created_by: user.id,
        }).select('*, material_grades(code)').single()
        if (plate) {
          plates.push(plate)
          // Link plate to GRN item
          if (grnItem) await db.from('grn_items').update({ plate_id: plate.id }).eq('id', grnItem.id)
        }
      }
    }
  }

  return NextResponse.json({ grn, plates })
}
