/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const db = adminDB() as any
  try {
    const { data } = await db.from('wps_library').select('*').order('wps_number')
    return NextResponse.json(data || [])
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any
  try {
    const { data, error } = await db.from('wps_library').insert({ ...body, created_by: user.id }).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
