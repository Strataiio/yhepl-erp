/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauth()
  const { id } = await params
  const body = await req.json()
  const db = adminDB() as any

  // If closing, set closed_at and closed_by
  const updates: any = { ...body }
  if (body.status === 'closed') { updates.closed_at = new Date().toISOString(); updates.closed_by = user.id }

  const { data, error } = await db.from('ncr').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If CAPA data provided, create/update CAPA
  if (body.capa) {
    const existing = await db.from('capa').select('id').eq('ncr_id', id).single()
    if (existing.data) {
      await db.from('capa').update({ ...body.capa, action_by: user.id }).eq('ncr_id', id)
    } else {
      await db.from('capa').insert({ ...body.capa, ncr_id: id, action_by: user.id })
    }
  }

  return NextResponse.json(data)
}
