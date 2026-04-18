/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const db = adminDB() as any

  const [
    projectsRes, bucketsRes, wipRes, waitingRes,
    ncrRes, stationsRes, recentProjectsRes,
    bucketsByProcessRes, openNcrProjectsRes,
  ] = await Promise.all([
    // Active project count
    db.from('projects').select('id, status, delivery_date', { count: 'exact' })
      .in('status', ['planning', 'in_production', 'qc_pending']),
    // Total active buckets
    db.from('buckets').select('id', { count: 'exact' })
      .not('status', 'in', '("closed")'),
    // WIP buckets with process info
    db.from('buckets')
      .select('id, bucket_code, actual_start_at, process_types(name, code, category)')
      .eq('status', 'wip')
      .order('actual_start_at', { ascending: true }),
    // Waiting buckets
    db.from('buckets').select('id', { count: 'exact' }).eq('status', 'waiting'),
    // Open NCRs
    db.from('ncr').select('id', { count: 'exact' }).in('status', ['open', 'under_capa']),
    // Station constraints
    db.from('v_station_constraints').select('*'),
    // Recent projects with delivery dates
    db.from('projects')
      .select('id, project_code, name, status, delivery_date, contract_value')
      .in('status', ['planning', 'in_production', 'qc_pending', 'order_confirmed'])
      .order('delivery_date', { ascending: true, nullsFirst: false })
      .limit(8),
    // Buckets grouped by process (for flow view)
    db.from('buckets')
      .select('status, process_types(id, name, code, category)')
      .not('status', 'in', '("closed")')
      .limit(500),
    // Projects with open NCRs
    db.from('ncr')
      .select('project_id, projects(project_code)')
      .in('status', ['open', 'under_capa'])
      .limit(20),
  ])

  // Group buckets by process
  const byProcess: Record<string, any> = {}
  ;(bucketsByProcessRes.data || []).forEach((b: any) => {
    const pid = b.process_types?.id
    if (!pid) return
    if (!byProcess[pid]) byProcess[pid] = { process: b.process_types, waiting: 0, wip: 0, qc_pending: 0, qc_passed: 0, qc_failed: 0, rework: 0 }
    const col = b.status === 'waiting' ? 'waiting' : b.status === 'wip' ? 'wip' : b.status === 'qc_pending' ? 'qc_pending' : b.status === 'qc_passed' ? 'qc_passed' : b.status === 'qc_failed' ? 'qc_failed' : b.status === 'rework' ? 'rework' : null
    if (col) byProcess[pid][col]++
  })

  // Delay alerts — projects past delivery date
  const now = new Date()
  const delays = (recentProjectsRes.data || []).filter((p: any) => {
    if (!p.delivery_date) return false
    return new Date(p.delivery_date) < now
  })

  // WIP hours
  const wipBuckets = (wipRes.data || []).map((b: any) => ({
    ...b,
    hours_in_wip: b.actual_start_at
      ? Math.round((Date.now() - new Date(b.actual_start_at).getTime()) / 3600000 * 10) / 10
      : 0,
  }))

  return NextResponse.json({
    kpis: {
      active_projects: projectsRes.count || 0,
      active_buckets: bucketsRes.count || 0,
      wip_buckets: wipRes.data?.length || 0,
      waiting_buckets: waitingRes.count || 0,
      open_ncrs: ncrRes.count || 0,
    },
    wip_buckets: wipBuckets,
    by_process: Object.values(byProcess),
    station_constraints: stationsRes.data || [],
    recent_projects: recentProjectsRes.data || [],
    delay_alerts: delays,
  })
}
