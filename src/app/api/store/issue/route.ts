/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('material_issues')
    .select('*, plates(plate_code, heat_number), remnants(remnant_code), buckets(bucket_code), projects(project_code)')
    .order('issued_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any

  const { data, error } = await db.from('material_issues').insert({
    ...body, issued_by: user.id, issued_at: new Date().toISOString(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update plate/remnant status if issued
  if (body.plate_id) await db.from('plates').update({ status: 'consumed' }).eq('id', body.plate_id)
  if (body.remnant_id) await db.from('remnants').update({ status: 'consumed' }).eq('id', body.remnant_id)

  return NextResponse.json(data)
}
