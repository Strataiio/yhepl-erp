/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  available:      { label: 'Available',     bg: '#f0fdf4', color: '#065f46' },
  partially_used: { label: 'Partial',       bg: '#fffbeb', color: '#92400e' },
  consumed:       { label: 'Consumed',      bg: '#f3f4f6', color: '#6b7280' },
  scrapped:       { label: 'Scrapped',      bg: '#fef2f2', color: '#991b1b' },
}

export default function PlatesPage() {
  const [plates, setPlates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [showCut, setShowCut] = useState(false)
  const [grades, setGrades] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [cutForm, setCutForm] = useState({ kerf_loss_mm: '3', notes: '', create_remnant: false, remnant_length: '', remnant_width: '', remnant_location_id: '' })
  const [cutComponents, setCutComponents] = useState([{ product_type_id: '', length_mm: '', width_mm: '', qty: '1' }])
  const [cutting, setCutting] = useState(false)
  const [cutResult, setCutResult] = useState<any>(null)
  const [cutError, setCutError] = useState('')

  async function load() { setLoading(true); const r = await fetch('/api/store/plates'); if (r.ok) setPlates(await r.json()); setLoading(false) }
  useEffect(() => {
    load()
    fetch('/api/masters?table=material_grades&order=code').then(r => r.json()).then(setGrades)
    fetch('/api/masters?table=stock_locations&order=name').then(r => r.json()).then(setLocations)
    fetch('/api/masters?table=product_types&order=name').then(r => r.json()).then(setProductTypes)
  }, [])

  const filtered = plates.filter(p => {
    const ms = statusFilter === 'all' || p.status === statusFilter
    const ms2 = !search || p.plate_code?.toLowerCase().includes(search.toLowerCase()) || p.heat_number?.toLowerCase().includes(search.toLowerCase()) || p.material_grades?.code?.toLowerCase().includes(search.toLowerCase())
    return ms && ms2
  })

  function openCut(plate: any) { setSelected(plate); setShowCut(true); setCutResult(null); setCutError(''); setCutComponents([{ product_type_id: '', length_mm: '', width_mm: '', qty: '1' }]) }

  async function doCut() {
    setCutting(true); setCutError('')
    try {
      const r = await fetch(`/api/store/plates/${selected.id}/cut`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kerf_loss_mm: parseFloat(cutForm.kerf_loss_mm) || 3,
          notes: cutForm.notes || null,
          cut_date: new Date().toISOString().split('T')[0],
          components: cutComponents.map(c => ({ ...c, length_mm: parseFloat(c.length_mm), width_mm: parseFloat(c.width_mm), qty: parseInt(c.qty) || 1 })).filter(c => c.length_mm && c.width_mm),
          create_remnant: cutForm.create_remnant,
          remnant: cutForm.create_remnant ? { length_mm: parseFloat(cutForm.remnant_length), width_mm: parseFloat(cutForm.remnant_width), location_id: cutForm.remnant_location_id || null } : null,
        })
      })
      if (!r.ok) throw new Error(await r.text())
      setCutResult(await r.json())
      load()
    } catch (e) { setCutError(String(e)) }
    setCutting(false)
  }

  const inp = (style: any = {}) => ({ padding: '7px 10px', fontSize: '12px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '6px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '10px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  const counts = plates.reduce((a: any, p) => { a[p.status] = (a[p.status] || 0) + 1; return a }, {})

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Plate inventory</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>All plates with heat number, grade, available area — click to cut</p>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
        {[['all', 'All'], ['available', 'Available'], ['partially_used', 'Partial'], ['consumed', 'Consumed']].map(([k, l]) => (
          <button key={k} onClick={() => setStatusFilter(k)}
            style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: statusFilter === k ? '#0f172a' : '#f1f5f9', color: statusFilter === k ? '#fff' : '#475569' }}>
            {l} {k !== 'all' && counts[k] ? `(${counts[k]})` : k === 'all' ? `(${plates.length})` : ''}
          </button>
        ))}
        <input placeholder="Search plate / heat no / grade..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '12px', outline: 'none', marginLeft: '8px', width: '240px' }} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Plate code', 'Heat no.', 'Grade', 'Thickness', 'Original (L×W)', 'Available area', 'Weight', 'Location', 'Status', ''].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No plates found{search ? ' — try clearing the search' : ''}</td></tr>}
            {filtered.map(p => {
              const cfg = STATUS_CFG[p.status] || STATUS_CFG.available
              const utilPct = p.available_area_sqmm && p.original_length_mm && p.original_width_mm
                ? Math.round((1 - p.available_area_sqmm / (p.original_length_mm * p.original_width_mm)) * 100) : 0
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '11px 12px', fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>{p.plate_code}</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#374151' }}>{p.heat_number}</td>
                  <td style={{ padding: '11px 12px' }}><span style={{ padding: '2px 8px', background: '#eff6ff', color: '#1e40af', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{p.material_grades?.code || '—'}</span></td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151', fontWeight: '600' }}>{p.thickness_mm}mm</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{p.original_length_mm}×{p.original_width_mm}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>{p.available_area_sqmm ? `${Math.round(p.available_area_sqmm / 10000)} cm²` : '—'}</div>
                    {utilPct > 0 && (
                      <div style={{ width: '60px', height: '4px', background: '#e5e7eb', borderRadius: '2px' }}>
                        <div style={{ width: `${utilPct}%`, height: '100%', background: utilPct > 80 ? '#ef4444' : '#f59e0b', borderRadius: '2px' }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{p.current_weight_kg}kg</td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#6b7280' }}>{p.stock_locations?.name || '—'}</td>
                  <td style={{ padding: '11px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                  <td style={{ padding: '11px 12px' }}>
                    {p.status !== 'consumed' && p.status !== 'scrapped' && (
                      <button onClick={() => openCut(p)} style={{ padding: '4px 10px', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✂ Cut</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cutting Panel */}
      {showCut && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '560px', height: '100vh', background: '#fff', overflowY: 'auto', padding: '28px', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Plate cutting — {selected.plate_code}</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Heat: {selected.heat_number} · {selected.material_grades?.code} · {selected.thickness_mm}mm · Available: {selected.available_area_sqmm ? `${Math.round(selected.available_area_sqmm / 1000)} dm²` : '—'}</p>
              </div>
              <button onClick={() => setShowCut(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>

            {cutResult && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>✓ Cut recorded</div>
                <div style={{ fontSize: '12px', color: '#065f46', marginTop: '4px' }}>
                  New available area: {Math.round((cutResult.new_available_area_sqmm || 0) / 10000)} cm² · Status: {cutResult.new_status}
                </div>
              </div>
            )}
            {cutError && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{cutError}</div>}

            {/* Cut components */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Components being cut</div>
                <button onClick={() => setCutComponents(c => [...c, { product_type_id: '', length_mm: '', width_mm: '', qty: '1' }])}
                  style={{ padding: '4px 10px', background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>+ Add</button>
              </div>
              {cutComponents.map((c, i) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 24px', gap: '8px', alignItems: 'end' }}>
                    <div><label style={lbl}>Product type</label><select style={inp()} value={c.product_type_id} onChange={e => setCutComponents(cs => cs.map((x, j) => j === i ? { ...x, product_type_id: e.target.value } : x))}><option value="">— Optional —</option>{productTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div><label style={lbl}>L (mm)</label><input style={inp()} type="number" value={c.length_mm} onChange={e => setCutComponents(cs => cs.map((x, j) => j === i ? { ...x, length_mm: e.target.value } : x))} /></div>
                    <div><label style={lbl}>W (mm)</label><input style={inp()} type="number" value={c.width_mm} onChange={e => setCutComponents(cs => cs.map((x, j) => j === i ? { ...x, width_mm: e.target.value } : x))} /></div>
                    <div><label style={lbl}>Qty</label><input style={inp()} type="number" value={c.qty} onChange={e => setCutComponents(cs => cs.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} /></div>
                    {cutComponents.length > 1 && <button onClick={() => setCutComponents(cs => cs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', lineHeight: 1, alignSelf: 'flex-end', paddingBottom: '2px' }}>×</button>}
                  </div>
                </div>
              ))}
            </div>

            {/* Kerf */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={lbl}>Kerf loss (mm)</label><input style={inp()} type="number" value={cutForm.kerf_loss_mm} onChange={e => setCutForm(f => ({ ...f, kerf_loss_mm: e.target.value }))} /></div>
              <div><label style={lbl}>Notes</label><input style={inp()} placeholder="Remarks..." value={cutForm.notes} onChange={e => setCutForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>

            {/* Remnant */}
            <div style={{ background: '#fefce8', borderRadius: '8px', padding: '12px', marginBottom: '20px', border: '1px solid #fde68a' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: cutForm.create_remnant ? '10px' : 0, fontSize: '13px', fontWeight: '600', color: '#854d0e' }}>
                <input type="checkbox" checked={cutForm.create_remnant} onChange={e => setCutForm(f => ({ ...f, create_remnant: e.target.checked }))} />
                Create remnant record from offcut
              </label>
              {cutForm.create_remnant && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '8px', marginTop: '8px' }}>
                  <div><label style={lbl}>Remnant L (mm)</label><input style={inp()} type="number" value={cutForm.remnant_length} onChange={e => setCutForm(f => ({ ...f, remnant_length: e.target.value }))} /></div>
                  <div><label style={lbl}>Remnant W (mm)</label><input style={inp()} type="number" value={cutForm.remnant_width} onChange={e => setCutForm(f => ({ ...f, remnant_width: e.target.value }))} /></div>
                  <div><label style={lbl}>Store location</label><select style={inp()} value={cutForm.remnant_location_id} onChange={e => setCutForm(f => ({ ...f, remnant_location_id: e.target.value }))}><option value="">— Same location —</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={doCut} disabled={cutting} style={{ flex: 1, padding: '12px', background: '#b45309', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                {cutting ? 'Recording cut...' : '✂ Record cut & update plate'}
              </button>
              <button onClick={() => setShowCut(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
