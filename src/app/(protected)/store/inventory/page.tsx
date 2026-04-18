/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function InventoryPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/store/inventory').then(r => r.json()).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', fontFamily: 'system-ui,sans-serif' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Consumable inventory</h1>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>Electrodes, gases, consumables — batch tracking and stock levels</p>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Item', 'Category', 'Batch', 'Qty on hand', 'Reserved', 'Available', 'UOM', 'Location'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No inventory records — items are added automatically on GRN</td></tr>}
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '600', color: '#111827' }}>{r.purchase_items?.name || '—'}</td>
                <td style={{ padding: '11px 14px' }}><span style={{ padding: '2px 8px', background: '#f0fdf4', color: '#065f46', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{r.purchase_items?.category || '—'}</span></td>
                <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#374151' }}>{r.batch_number || '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{r.qty_on_hand}</td>
                <td style={{ padding: '11px 14px', fontSize: '13px', color: '#d97706' }}>{r.qty_reserved || 0}</td>
                <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '600', color: '#059669' }}>{(r.qty_on_hand || 0) - (r.qty_reserved || 0)}</td>
                <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>{r.uom_master?.code || '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{r.stock_locations?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
