/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

// Weld management uses the joint_register table from schema
// If it doesn't exist yet, we handle it gracefully

export async function GET(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const db = adminDB() as any

  try {
    let q = db.from('joint_register')
      .select('*, projects(project_code, name), wps_library(wps_number, title, applicable_code), welders:welder_id(full_name, employee_code)')
      .order('created_at', { ascending: false }).limit(200)
    if (projectId) q = q.eq('project_id', projectId)
    const { data, error } = await q
    if (error) throw error
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any
  try {
    const { data, error } = await db.from('joint_register').insert({ ...body, created_by: user.id }).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const body = await req.json()
  const { id, ...updates } = body
  const db = adminDB() as any
  try {
    const { data, error } = await db.from('joint_register').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
