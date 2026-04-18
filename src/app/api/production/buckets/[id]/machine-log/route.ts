/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function admin() { return createAdminSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } }) }
async function getUser() { const s = await createServerClient(); const { data: { user } } = await s.auth.getUser(); return user }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data, error } = await (admin() as any)
    .from('machine_logs')
    .select('*, machines(name, code)')
    .eq('bucket_id', id)
    .order('start_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  // body: { machine_id, action: 'start'|'stop', stop_reason?, notes?, log_id? }

  if (body.action === 'start') {
    const { data, error } = await (admin() as any)
      .from('machine_logs')
      .insert({ bucket_id: id, machine_id: body.machine_id, started_by: user.id, start_at: new Date().toISOString(), notes: body.notes || null })
      .select('*, machines(name, code)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (body.action === 'stop' && body.log_id) {
    const endAt = new Date().toISOString()
    const startRes = await (admin() as any).from('machine_logs').select('start_at').eq('id', body.log_id).single()
    const durationMins = startRes.data
      ? Math.round((new Date(endAt).getTime() - new Date(startRes.data.start_at).getTime()) / 60000)
      : null
    const { data, error } = await (admin() as any)
      .from('machine_logs')
      .update({ end_at: endAt, stopped_by: user.id, duration_mins: durationMins, stop_reason: body.stop_reason || 'normal', notes: body.notes || null })
      .eq('id', body.log_id)
      .select('*, machines(name, code)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
