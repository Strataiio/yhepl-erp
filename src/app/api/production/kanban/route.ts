/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const db = adminDB() as any

  // All non-closed buckets grouped by process
  const { data: buckets, error } = await db
    .from('buckets')
    .select(`
      id, bucket_code, status, input_qty, planned_start_date, actual_start_at, actual_end_at,
      qc_pass_qty, qc_fail_qty, remarks, parent_bucket_id,
      projects(id, project_code, name),
      assemblies(name),
      input_pt:input_product_type_id(name, code),
      planned_output_pt:planned_output_product_type_id(name),
      process_types(id, name, code, category, default_machine_id),
      process_stations(name),
      machines:assigned_machine_id(name, code)
    `)
    .not('status', 'in', '("closed")')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get all process types that have buckets
  const processMap: Record<string, any> = {}
  ;(buckets || []).forEach((b: any) => {
    const pid = b.process_types?.id
    if (!pid) return
    if (!processMap[pid]) {
      processMap[pid] = {
        process: b.process_types,
        waiting: [], wip: [], done: [], qc_pending: [], qc_failed: [], rework: []
      }
    }
    const col =
      b.status === 'waiting' ? 'waiting' :
      b.status === 'wip'     ? 'wip' :
      // qc_passed = Done in our new model
      (b.status === 'qc_passed' || b.status === 'planned') ? 'done' :
      b.status === 'qc_pending' ? 'qc_pending' :
      b.status === 'qc_failed'  ? 'qc_failed' :
      b.status === 'rework'     ? 'rework' : 'waiting'
    processMap[pid][col].push(b)
  })

  // Summary
  const all = buckets || []
  return NextResponse.json({
    kanban: Object.values(processMap),
    summary: {
      total:      all.length,
      waiting:    all.filter((b: any) => b.status === 'waiting').length,
      wip:        all.filter((b: any) => b.status === 'wip').length,
      done:       all.filter((b: any) => b.status === 'qc_passed').length,
    }
  })
}
