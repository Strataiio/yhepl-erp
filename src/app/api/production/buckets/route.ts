/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function admin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
async function getUser() {
  const s = await createServerClient()
  const { data: { user } } = await s.auth.getUser()
  return user
}

// GET — list all buckets with joins
export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')
  const status = searchParams.get('status')

  let query = (admin() as any)
    .from('buckets')
    .select(`
      *,
      projects(project_code, name),
      assemblies(name),
      input_pt:input_product_type_id(name, code),
      planned_output_pt:planned_output_product_type_id(name, code),
      process_types(id, name, code, category, default_machine_id),
      process_stations(name),
      machines:assigned_machine_id(name, code),
      created_by_profile:created_by(full_name)
    `)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create bucket
export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await (admin() as any)
    .from('buckets')
    .insert({ ...body, created_by: user.id })
    .select(`*, process_types(name), input_pt:input_product_type_id(name), process_stations(name)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
