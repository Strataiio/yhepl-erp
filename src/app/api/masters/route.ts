/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

const ALLOWED_TABLES = [
  // Masters
  'process_types','process_stations','process_routes','route_steps',
  'product_types','material_grades','machines','customers','vendors',
  'uom_master','cost_rates','qc_checkpoints','process_parameter_schemas',
  'departments','designations','shifts','stock_locations','scrap_categories',
  'document_types','wps_library','purchase_items','itp_templates','labour_agencies',
  // Projects
  'projects','assemblies','project_bom','project_budgets',
  // Production
  'buckets','bucket_history','process_parameter_logs',
  'qc_logs','ncr','capa','cost_events',
  // Store
  'plates','remnants','inventory','material_issues','grn','grn_items',
  'purchase_orders','po_items','rfq','vendor_quotations',
  // HR
  'employees','attendance','leave_applications','payroll_runs','payroll_line_items',
  // Weld
  'joint_register','weld_logs','ndt_results',
  // User
  'user_profiles'
]

function admin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')
  const select = searchParams.get('select') || '*'
  const order = searchParams.get('order') || 'created_at'
  const orderAsc = searchParams.get('asc') === 'true'
  const filter = searchParams.get('filter')     // col=val
  const filter2 = searchParams.get('filter2')   // col=val
  const limit = parseInt(searchParams.get('limit') || '500')

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 })
  }

  const db = admin()
  let query = (db as any).from(table).select(select).order(order, { ascending: orderAsc }).limit(limit)

  if (filter) {
    const [col, ...rest] = filter.split('=')
    const val = rest.join('=')
    query = query.eq(col, val)
  }
  if (filter2) {
    const [col, ...rest] = filter2.split('=')
    const val = rest.join('=')
    query = query.eq(col, val)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { table, payload, id } = body

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 })
  }

  const db = admin()
  if (id) {
    const { data, error } = await (db as any).from(table).update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } else {
    const { data, error } = await (db as any).from(table).insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { table, filter_col, filter_val } = body

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 })
  }

  const db = admin()
  const { error } = await (db as any).from(table).delete().eq(filter_col, filter_val)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
