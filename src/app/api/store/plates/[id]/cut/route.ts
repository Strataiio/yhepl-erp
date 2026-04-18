/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauth()
  const { id } = await params
  const body = await req.json()
  // body: { bucket_id?, cut_date, kerf_loss_mm, components: [{product_type_id, length_mm, width_mm, qty}], create_remnant: bool, remnant: {length_mm, width_mm, location_id} }

  const db = adminDB() as any

  // Get plate current state
  const { data: plate } = await db.from('plates').select('*').eq('id', id).single()
  if (!plate) return NextResponse.json({ error: 'Plate not found' }, { status: 404 })

  const kerf = body.kerf_loss_mm || 3
  const components = body.components || []

  // Calculate total area consumed by components
  let areaConsumed = 0
  components.forEach((c: any) => { areaConsumed += c.length_mm * c.width_mm * (c.qty || 1) })
  // Add kerf area (simplified: kerf per cut)
  const kerfArea = kerf * (plate.original_length_mm + plate.original_width_mm) * components.length

  const newAvailableArea = Math.max(0, (plate.available_area_sqmm || 0) - areaConsumed - kerfArea)
  const weightFactor = newAvailableArea / (plate.original_length_mm * plate.original_width_mm)
  const newWeight = Math.round(plate.original_weight_kg * weightFactor * 1000) / 1000

  // Create plate_cut record
  const { data: cut } = await db.from('plate_cuts').insert({
    plate_id: id,
    bucket_id: body.bucket_id || null,
    cut_date: body.cut_date || new Date().toISOString().split('T')[0],
    kerf_loss_mm: kerf,
    operator_id: user.id,
    notes: body.notes || null,
  }).select().single()

  // Create cut_components
  if (cut && components.length > 0) {
    await db.from('cut_components').insert(
      components.map((c: any) => ({
        plate_cut_id: cut.id,
        product_type_id: c.product_type_id || null,
        length_mm: c.length_mm,
        width_mm: c.width_mm,
        qty: c.qty || 1,
        weight_kg: c.length_mm && c.width_mm ? Math.round((c.length_mm * c.width_mm * plate.thickness_mm * 7.85 / 1000000000) * 1000 * (c.qty || 1)) / 1000 : null,
        heat_number: plate.heat_number,
        parent_plate_id: id,
      }))
    )
  }

  // Create remnant if requested
  if (body.create_remnant && body.remnant?.length_mm && body.remnant?.width_mm) {
    const r = body.remnant
    const rmnCode = `RMN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    await db.from('remnants').insert({
      remnant_code: rmnCode,
      parent_plate_id: id,
      heat_number: plate.heat_number,
      material_grade_id: plate.material_grade_id,
      thickness_mm: plate.thickness_mm,
      length_mm: r.length_mm,
      width_mm: r.width_mm,
      area_sqmm: r.length_mm * r.width_mm,
      weight_kg: Math.round(r.length_mm * r.width_mm * plate.thickness_mm * 7.85 / 1000000000 * 1000) / 1000,
      location_id: r.location_id || plate.location_id,
      status: 'available',
      created_from_cut_id: cut?.id || null,
    })
  }

  // Update plate available area + status
  const newStatus = newAvailableArea < (plate.original_length_mm * plate.original_width_mm * 0.05)
    ? 'consumed' : newAvailableArea < (plate.original_length_mm * plate.original_width_mm * 0.5)
    ? 'partially_used' : 'available'

  await db.from('plates').update({ available_area_sqmm: newAvailableArea, current_weight_kg: newWeight, status: newStatus }).eq('id', id)

  return NextResponse.json({ success: true, cut_id: cut?.id, new_available_area_sqmm: newAvailableArea, new_status: newStatus })
}
