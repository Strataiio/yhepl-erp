/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

/**
 * POST /api/production/buckets/[id]/split
 * Splits a bucket into two child buckets — typically after QC failure.
 * Parent bucket is closed. Two children created:
 *   - pass child  → next process (waiting)
 *   - fail child  → rework process (waiting)
 *
 * Body: { pass_qty, fail_qty, pass_process_type_id?, fail_process_type_id?, split_reason }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauth()
  const { id } = await params
  const body = await req.json()
  const db = adminDB() as any

  // Get parent bucket
  const { data: parent, error: pe } = await db.from('buckets').select('*').eq('id', id).single()
  if (pe || !parent) return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })

  const passQty = parseFloat(body.pass_qty) || 0
  const failQty = parseFloat(body.fail_qty) || 0
  const splitReason = body.split_reason || 'qc_split'

  const created: any[] = []

  // Create pass-qty child bucket (continues to next process)
  if (passQty > 0) {
    const passCode = `${parent.bucket_code}-P`
    const { data: passChild } = await db.from('buckets').insert({
      bucket_code: passCode,
      project_id: parent.project_id,
      assembly_id: parent.assembly_id,
      parent_bucket_id: parent.id,
      input_product_type_id: parent.planned_output_product_type_id || parent.input_product_type_id,
      input_qty: passQty,
      input_uom_id: parent.planned_output_uom_id || parent.input_uom_id,
      planned_output_product_type_id: body.pass_output_product_type_id || null,
      process_type_id: body.pass_process_type_id || parent.process_type_id,
      station_id: null,
      status: 'waiting',
      split_reason: splitReason,
      remarks: `Split from ${parent.bucket_code} — pass qty`,
      created_by: user.id,
    }).select('*, process_types(name), input_pt:input_product_type_id(name)').single()
    if (passChild) created.push({ type: 'pass', bucket: passChild })
  }

  // Create fail-qty child bucket (goes to rework)
  if (failQty > 0) {
    const failCode = `${parent.bucket_code}-R`
    const { data: failChild } = await db.from('buckets').insert({
      bucket_code: failCode,
      project_id: parent.project_id,
      assembly_id: parent.assembly_id,
      parent_bucket_id: parent.id,
      input_product_type_id: parent.input_product_type_id,
      input_qty: failQty,
      input_uom_id: parent.input_uom_id,
      process_type_id: body.fail_process_type_id || parent.process_type_id,
      station_id: null,
      status: 'waiting',
      split_reason: 'rework',
      remarks: `Split from ${parent.bucket_code} — fail qty (rework)`,
      created_by: user.id,
    }).select('*, process_types(name), input_pt:input_product_type_id(name)').single()
    if (failChild) created.push({ type: 'rework', bucket: failChild })
  }

  // Close parent bucket + log history
  await db.from('buckets').update({
    status: 'closed',
    qc_pass_qty: passQty,
    qc_fail_qty: failQty,
    actual_output_qty: passQty,
    remarks: `${splitReason} — split into ${created.map(c => c.bucket.bucket_code).join(', ')}`,
    actual_end_at: new Date().toISOString(),
  }).eq('id', id)

  // Log split event to bucket_history for both children
  for (const child of created) {
    await db.from('bucket_history').insert({
      bucket_id: id,
      from_status: parent.status,
      to_status: 'closed',
      event_type: 'split',
      notes: `Split → ${child.bucket.bucket_code} (${child.type})`,
      metadata: { split_reason: splitReason, child_id: child.bucket.id },
      created_by: user.id,
    })
  }

  return NextResponse.json({ parent_closed: true, children: created })
}
