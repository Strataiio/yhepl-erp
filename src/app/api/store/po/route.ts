/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { adminDB, requireUser, unauth } from '@/lib/api-helpers'

export async function GET() {
  if (!await requireUser()) return unauth()
  const { data, error } = await (adminDB() as any)
    .from('purchase_orders')
    .select('*, vendors(name, code), po_items(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauth()
  const body = await req.json()
  const db = adminDB() as any

  const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  const items = body.items || []
  const totalAmount = items.reduce((s: number, i: any) => s + (i.qty_ordered * i.unit_rate), 0)
  const gstAmount = totalAmount * ((body.gst_rate || 18) / 100)

  const { data: po, error } = await db.from('purchase_orders').insert({
    po_number: poNumber,
    vendor_id: body.vendor_id,
    project_id: body.project_id || null,
    po_date: new Date().toISOString().split('T')[0],
    delivery_date: body.delivery_date || null,
    status: 'approved',
    payment_terms: body.payment_terms || null,
    total_amount: totalAmount,
    gst_amount: gstAmount,
    grand_total: totalAmount + gstAmount,
    notes: body.notes || null,
    created_by: user.id,
    zoho_sync_status: 'pending',
  }).select('*, vendors(name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items.length > 0) {
    await db.from('po_items').insert(items.map((item: any, i: number) => ({
      po_id: po.id,
      line_number: i + 1,
      description: item.description,
      qty_ordered: item.qty_ordered,
      qty_received: 0,
      unit_rate: item.unit_rate,
      gst_rate: item.gst_rate || 18,
      amount: item.qty_ordered * item.unit_rate,
    })))
  }

  return NextResponse.json(po)
}
