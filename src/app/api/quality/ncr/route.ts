/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const db = adminDB() as any
  let q = db.from('ncr')
    .select('*, projects(project_code, name), buckets(bucket_code), raised_by_profile:raised_by(full_name), assigned_to_profile:assigned_to(full_name), capa(*)')
    .order('raised_at', { ascending: false })
  if (projectId) q = q.eq('project_id', projectId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any
  const ncrNum = `NCR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  const { data, error } = await db.from('ncr').insert({
    ...body, ncr_number: ncrNum, raised_by: user.id, raised_at: new Date().toISOString(), status: 'open'
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
