/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('inventory')
    .select('*, purchase_items(name, code, category), uom_master(code), stock_locations(name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!await requireUser()) return unauth()
  const body = await req.json()
  const { data, error } = await (adminDB() as any).from('inventory').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
