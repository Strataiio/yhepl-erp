/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function RemnantsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('available')

  async function load() { setLoading(true); const r = await fetch('/api/store/remnants'); if (r.ok) setRows(await r.json()); setLoading(false) }
  useEffect(() => { load() }, [])

  const filtered = rows.filter(r => {
    const ms = statusFilter === 'all' || r.status === statusFilter
    const ms2 = !search || r.remnant_code?.toLowerCase().includes(search.toLowerCase()) || r.heat_number?.toLowerCase().includes(search.toLowerCase()) || r.material_grades?.code?.toLowerCase().includes(search.toLowerCase())
    return ms && ms2
  })

  async function toggleReserve(r: any) {
    await fetch('/api/store/remnants', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, is_reserved: !r.is_reserved, status: !r.is_reserved ? 'available' : 'available' }) })
    load()
  }

  const STATUS_CFG: Record<string, any> = {
    available: { bg: '#f0fdf4', color: '#065f46', label: 'Available' },
    consumed:  { bg: '#f3f4f6', color: '#6b7280', label: 'Consumed' },
    scrapped:  { bg: '#fef2f2', color: '#991b1b', label: 'Scrapped' },
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Remnant register</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Plate offcuts — reuse before buying new material</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
        {[['all', 'All'], ['available', 'Available'], ['consumed', 'Consumed']].map(([k, l]) => (
          <button key={k} onClick={() => setStatusFilter(k)} style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: statusFilter === k ? '#0f172a' : '#f1f5f9', color: statusFilter === k ? '#fff' : '#475569' }}>{l}</button>
        ))}
        <input placeholder="Search code / heat / grade..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '12px', outline: 'none', marginLeft: '8px', width: '220px' }} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Remnant code', 'Parent plate', 'Heat no.', 'Grade', 'Thickness', 'Dimensions (L×W)', 'Area', 'Weight', 'Location', 'Status', ''].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No remnants found</td></tr>}
            {filtered.map(r => {
              const cfg = STATUS_CFG[r.status] || STATUS_CFG.available
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '11px 12px', fontSize: '12px', fontWeight: '700', color: '#7c3aed' }}>{r.remnant_code}</td>
                  <td style={{ padding: '11px 12px', fontSize: '11px', color: '#1e40af' }}>{r.plates?.plate_code || '—'}</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#374151' }}>{r.heat_number}</td>
                  <td style={{ padding: '11px 12px' }}><span style={{ padding: '2px 8px', background: '#eff6ff', color: '#1e40af', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{r.material_grades?.code || '—'}</span></td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>{r.thickness_mm}mm</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{r.length_mm}×{r.width_mm}</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{r.area_sqmm ? `${Math.round(r.area_sqmm / 10000)} cm²` : '—'}</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{r.weight_kg ? `${r.weight_kg}kg` : '—'}</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#6b7280' }}>{r.stock_locations?.name || '—'}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    {r.is_reserved && <span style={{ marginLeft: '4px', padding: '1px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '10px', fontWeight: '600' }}>Reserved</span>}
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    {r.status === 'available' && (
                      <button onClick={() => toggleReserve(r)} style={{ padding: '3px 8px', background: r.is_reserved ? '#fef2f2' : '#f0fdf4', color: r.is_reserved ? '#dc2626' : '#065f46', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        {r.is_reserved ? 'Unreserve' : 'Reserve'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
