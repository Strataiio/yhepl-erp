'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Summary = { plates_available: number; plates_partial: number; remnants_available: number; open_pos: number; pending_grns: number }

export default function StorePage() {
  const [summary, setSummary] = useState<Summary>({ plates_available: 0, plates_partial: 0, remnants_available: 0, open_pos: 0, pending_grns: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/store/plates').then(r => r.json()),
      fetch('/api/store/remnants').then(r => r.json()),
      fetch('/api/store/po').then(r => r.json()),
      fetch('/api/store/grn').then(r => r.json()),
    ]).then(([plates, remnants, pos, grns]) => {
      setSummary({
        plates_available: Array.isArray(plates) ? plates.filter((p: any) => p.status === 'available').length : 0,
        plates_partial: Array.isArray(plates) ? plates.filter((p: any) => p.status === 'partially_used').length : 0,
        remnants_available: Array.isArray(remnants) ? remnants.filter((r: any) => r.status === 'available').length : 0,
        open_pos: Array.isArray(pos) ? pos.filter((p: any) => ['approved','sent','partially_received'].includes(p.status)).length : 0,
        pending_grns: Array.isArray(grns) ? grns.slice(0, 10).length : 0,
      })
    }).catch(() => {})
  }, [])

  const MODULES = [
    { href: '/store/grn', label: 'GRN', desc: 'Receive plates, consumables and materials from vendors', color: '#1e40af', stat: `${summary.pending_grns} recent receipts` },
    { href: '/store/plates', label: 'Plate inventory', desc: 'All plates — status, heat number, available area, cutting history', color: '#0f766e', stat: `${summary.plates_available} full · ${summary.plates_partial} partial` },
    { href: '/store/remnants', label: 'Remnant register', desc: 'Plate offcuts — grade, dimensions, reserve for production', color: '#5b21b6', stat: `${summary.remnants_available} available` },
    { href: '/store/purchase-orders', label: 'Purchase orders', desc: 'Create and track POs to vendors', color: '#b45309', stat: `${summary.open_pos} open POs` },
    { href: '/store/inventory', label: 'Consumable inventory', desc: 'Electrodes, gases, consumables — stock levels and batches', color: '#065f46', stat: '' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>Store</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Inventory, procurement, and material management</p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Plates available', value: summary.plates_available, color: '#059669' },
          { label: 'Partial plates', value: summary.plates_partial, color: '#d97706' },
          { label: 'Remnants', value: summary.remnants_available, color: '#7c3aed' },
          { label: 'Open POs', value: summary.open_pos, color: '#1e40af' },
        ].map(k => (
          <div key={k.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: '600' }}>{k.label}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {MODULES.map(m => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `3px solid ${m.color}`, borderRadius: '10px', padding: '18px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '5px' }}>{m.label}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5', marginBottom: '8px' }}>{m.desc}</div>
              {m.stat && <div style={{ fontSize: '11px', fontWeight: '600', color: m.color }}>{m.stat}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
