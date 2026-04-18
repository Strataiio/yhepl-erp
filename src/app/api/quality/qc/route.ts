/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const bucketId = searchParams.get('bucket_id')
  const db = adminDB() as any
  let q = db.from('qc_logs')
    .select('*, buckets(bucket_code, status), projects(project_code), process_types:buckets(process_types(name))')
    .order('inspected_at', { ascending: false }).limit(100)
  if (projectId) q = q.eq('project_id', projectId)
  if (bucketId) q = q.eq('bucket_id', bucketId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  // body: { bucket_id, project_id, checkpoint_id?, input_qty, pass_qty, fail_qty, result, parameter_results, remarks }
  const db = adminDB() as any

  // Insert QC log
  const { data: qcLog, error: qe } = await db.from('qc_logs').insert({
    bucket_id: body.bucket_id,
    project_id: body.project_id,
    checkpoint_id: body.checkpoint_id || null,
    inspector_id: user.id,
    inspected_at: new Date().toISOString(),
    input_qty: body.input_qty,
    pass_qty: body.pass_qty,
    fail_qty: body.fail_qty,
    result: body.result,
    parameter_results: body.parameter_results || null,
    remarks: body.remarks || null,
  }).select().single()
  if (qe) return NextResponse.json({ error: qe.message }, { status: 500 })

  // Update bucket status based on result
  let newStatus = body.result === 'pass' ? 'qc_passed' : body.result === 'fail' ? 'qc_failed' : body.result === 'partial_pass' ? 'qc_passed' : 'qc_pending'
  const bucketUpdates: any = {
    status: newStatus,
    qc_pass_qty: body.pass_qty,
    qc_fail_qty: body.fail_qty,
  }
  if (body.result === 'partial_pass' || body.result === 'pass') {
    bucketUpdates.actual_output_qty = body.pass_qty
  }
  await db.from('buckets').update(bucketUpdates).eq('id', body.bucket_id)

  // Auto-raise NCR if fail or partial
  let ncr = null
  if ((body.result === 'fail' || body.result === 'partial_pass') && body.fail_qty > 0) {
    const ncrNum = `NCR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const failedParams = (body.parameter_results || []).filter((p: any) => !p.pass)
    const { data: ncrData } = await db.from('ncr').insert({
      ncr_number: ncrNum,
      project_id: body.project_id,
      bucket_id: body.bucket_id,
      qc_log_id: qcLog.id,
      raised_by: user.id,
      raised_at: new Date().toISOString(),
      defect_description: body.remarks || `QC failure — ${body.fail_qty} units failed`,
      failed_parameters: failedParams.length > 0 ? failedParams : null,
      status: 'open',
    }).select().single()
    ncr = ncrData
  }

  return NextResponse.json({ qc_log: qcLog, ncr, new_bucket_status: newStatus })
}
