/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function admin() { return createAdminSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } }) }
async function getUser() { const s = await createServerClient(); const { data: { user } } = await s.auth.getUser(); return user }

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all active buckets with full joins
  const { data: buckets, error: be } = await (admin() as any)
    .from('buckets')
    .select(`
      id, bucket_code, status, input_qty, planned_start_date, planned_end_date, actual_start_at, qc_pass_qty, qc_fail_qty, remarks,
      projects(project_code, name),
      assemblies(name),
      input_pt:input_product_type_id(name, code),
      process_types(id, name, code, category),
      process_stations(name),
      machines:assigned_machine_id(name, code)
    `)
    .not('status', 'in', '("closed")')
    .order('created_at', { ascending: false })

  if (be) return NextResponse.json({ error: be.message }, { status: 500 })

  // Get all process types for columns
  const { data: processes } = await (admin() as any)
    .from('process_types')
    .select('id, name, code, category')
    .eq('is_active', true)
    .order('name')

  // Build kanban structure: { processId: { process, waiting:[], wip:[], qc_pending:[], qc_passed:[], qc_failed:[], rework:[] } }
  const kanban: Record<string, any> = {}

  // Init with all processes that have buckets
  const processesWithBuckets = new Set((buckets || []).map((b: any) => b.process_types?.id).filter(Boolean))

  ;(processes || [])
    .filter((p: any) => processesWithBuckets.has(p.id))
    .forEach((p: any) => {
      kanban[p.id] = { process: p, waiting: [], wip: [], qc_pending: [], qc_passed: [], qc_failed: [], rework: [], planned: [] }
    })

  ;(buckets || []).forEach((b: any) => {
    const pid = b.process_types?.id
    if (!pid) return
    if (!kanban[pid]) kanban[pid] = { process: b.process_types, waiting: [], wip: [], qc_pending: [], qc_passed: [], qc_failed: [], rework: [], planned: [] }
    const col = b.status === 'waiting' ? 'waiting' : b.status === 'wip' ? 'wip' : b.status === 'qc_pending' ? 'qc_pending' : b.status === 'qc_passed' ? 'qc_passed' : b.status === 'qc_failed' ? 'qc_failed' : b.status === 'rework' ? 'rework' : 'planned'
    kanban[pid][col].push(b)
  })

  // Station constraints
  const { data: constraints } = await (admin() as any).from('v_station_constraints').select('*')

  return NextResponse.json({
    kanban: Object.values(kanban),
    constraints: constraints || [],
    summary: {
      total: (buckets || []).length,
      waiting: (buckets || []).filter((b: any) => b.status === 'waiting').length,
      wip: (buckets || []).filter((b: any) => b.status === 'wip').length,
      qc_pending: (buckets || []).filter((b: any) => b.status === 'qc_pending').length,
    }
  })
}
