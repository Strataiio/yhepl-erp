/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const { searchParams } = new URL(req.url)
  const bucketId = searchParams.get('bucket_id')
  const db = adminDB() as any
  let q = db.from('finished_goods')
    .select('*, buckets(bucket_code), projects(project_code), product_types(name), stock_locations(name)')
    .order('recorded_at', { ascending: false })
    .limit(100)
  if (bucketId) q = q.eq('bucket_id', bucketId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any

  const fgCode = `FG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const { data, error } = await db.from('finished_goods').insert({
    record_code: fgCode,
    bucket_id: body.bucket_id,
    project_id: body.project_id,
    product_type_id: body.product_type_id || null,
    accepted_qty: parseFloat(body.accepted_qty) || 0,
    rejected_qty: parseFloat(body.rejected_qty) || 0,
    total_qty: (parseFloat(body.accepted_qty) || 0) + (parseFloat(body.rejected_qty) || 0),
    destination: body.destination || 'inventory',
    location_id: body.location_id || null,
    notes: body.notes || null,
    recorded_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update bucket status to closed + store QC qtys
  await db.from('buckets').update({
    status: 'closed',
    qc_pass_qty: parseFloat(body.accepted_qty) || 0,
    qc_fail_qty: parseFloat(body.rejected_qty) || 0,
    actual_output_qty: parseFloat(body.accepted_qty) || 0,
    actual_end_at: new Date().toISOString(),
    remarks: body.notes || null,
  }).eq('id', body.bucket_id)

  // If pushing to next process, create the child bucket
  let nextBucket = null
  if (body.destination === 'next_process' && body.next_process_type_id && parseFloat(body.accepted_qty) > 0) {
    const parentRes = await db.from('buckets').select('*').eq('id', body.bucket_id).single()
    const parent = parentRes.data
    if (parent) {
      const nextCode = `${parent.bucket_code}→`
      const { data: nb } = await db.from('buckets').insert({
        bucket_code: nextCode,
        project_id: parent.project_id,
        assembly_id: parent.assembly_id,
        parent_bucket_id: parent.id,
        input_product_type_id: body.next_input_product_type_id || parent.planned_output_product_type_id || parent.input_product_type_id,
        input_qty: parseFloat(body.accepted_qty),
        process_type_id: body.next_process_type_id,
        status: 'waiting',
        remarks: `From ${parent.bucket_code}`,
        created_by: user.id,
      }).select('*, process_types(name), input_pt:input_product_type_id(name)').single()
      nextBucket = nb
      // Link FG record to next bucket
      if (data && nb) await db.from('finished_goods').update({ next_bucket_id: nb.id }).eq('id', data.id)
    }
  }

  return NextResponse.json({ fg: data, next_bucket: nextBucket })
}
