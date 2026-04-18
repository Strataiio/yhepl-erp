/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function GRNPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [grnType, setGrnType] = useState('plate')
  const [form, setForm] = useState({ vendor_id: '', dc_number: '', vehicle_number: '', notes: '' })
  const [items, setItems] = useState<any[]>([{ description: '', heat_number: '', material_grade_id: '', thickness_mm: '', length_mm: '', width_mm: '', weight_kg: '', qty_received: '1', unit_rate: '', location_id: '', mtc_url: '' }])

  async function load() { setLoading(true); const r = await fetch('/api/store/grn'); if (r.ok) setRows(await r.json()); setLoading(false) }
  useEffect(() => {
    load()
    fetch('/api/masters?table=vendors&order=name').then(r => r.json()).then(setVendors)
    fetch('/api/masters?table=material_grades&order=code').then(r => r.json()).then(setGrades)
    fetch('/api/masters?table=stock_locations&order=name').then(r => r.json()).then(setLocations)
  }, [])

  function addItem() { setItems(i => [...i, { description: '', heat_number: '', material_grade_id: '', thickness_mm: '', length_mm: '', width_mm: '', weight_kg: '', qty_received: '1', unit_rate: '', location_id: '', mtc_url: '' }]) }
  function updateItem(idx: number, k: string, v: string) { setItems(i => i.map((x, j) => j === idx ? { ...x, [k]: v } : x)) }
  function removeItem(idx: number) { setItems(i => i.filter((_, j) => j !== idx)) }

  async function save() {
    setSaving(true); setError(''); setResult(null)
    try {
      const r = await fetch('/api/store/grn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, grn_type: grnType,
          items: items.map(i => ({
            ...i,
            thickness_mm: i.thickness_mm ? parseFloat(i.thickness_mm) : null,
            length_mm: i.length_mm ? parseFloat(i.length_mm) : null,
            width_mm: i.width_mm ? parseFloat(i.width_mm) : null,
            weight_kg: i.weight_kg ? parseFloat(i.weight_kg) : null,
            qty_received: parseFloat(i.qty_received) || 1,
            unit_rate: i.unit_rate ? parseFloat(i.unit_rate) : null,
          }))
        })
      })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      setResult(data)
      load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const inp = (style: any = {}) => ({ padding: '8px 10px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '10px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Goods Receipt (GRN)</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Receive plates or materials — plates auto-create Plate master records with QR</p>
        </div>
        <button onClick={() => { setShowForm(true); setResult(null); setError('') }} style={{ padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ New GRN</button>
      </div>

      {/* GRN History */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['GRN number', 'Type', 'Vendor', 'Date', 'Items', 'DC / Vehicle', ''].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No GRNs yet</td></tr>}
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{r.grn_number}</td>
                <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', background: r.grn_type === 'plate' ? '#eff6ff' : '#f0fdf4', color: r.grn_type === 'plate' ? '#1e40af' : '#065f46', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{r.grn_type}</span></td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{r.vendors?.name || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{r.grn_date ? new Date(r.grn_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{r.grn_items?.length || 0} items</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280' }}>{[r.dc_number, r.vehicle_number].filter(Boolean).join(' / ') || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: '11px', color: '#9ca3af' }}>{r.zoho_sync_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GRN Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '680px', height: '100vh', background: '#fff', overflowY: 'auto', padding: '28px', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>New GRN</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>

            {/* Success result */}
            {result && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#065f46', marginBottom: '8px' }}>✓ GRN created — {result.grn?.grn_number}</div>
                {result.plates?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '6px' }}>{result.plates.length} plate(s) created:</div>
                    {result.plates.map((p: any) => (
                      <div key={p.id} style={{ background: '#fff', borderRadius: '6px', padding: '8px 10px', marginBottom: '4px', fontSize: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{p.plate_code}</div>
                        <div style={{ color: '#6b7280' }}>Heat: {p.heat_number} · Grade: {p.material_grades?.code} · QR: {p.qr_code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

            {/* GRN type */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              {['plate', 'consumable', 'bought_out'].map(t => (
                <button key={t} onClick={() => setGrnType(t)} style={{ padding: '7px 16px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: grnType === t ? '#1e40af' : '#f1f5f9', color: grnType === t ? '#fff' : '#374151' }}>{t.replace(/_/g, ' ')}</button>
              ))}
            </div>

            {/* Header fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={lbl}>Vendor *</label><select style={inp()} value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}><option value="">— Select vendor —</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div><label style={lbl}>DC number</label><input style={inp()} placeholder="DC/001" value={form.dc_number} onChange={e => setForm(f => ({ ...f, dc_number: e.target.value }))} /></div>
              <div><label style={lbl}>Vehicle no.</label><input style={inp()} placeholder="TN 01 AB 1234" value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} /></div>
            </div>

            {/* Items */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{grnType === 'plate' ? 'Plates received' : 'Items received'}</div>
                <button onClick={addItem} style={{ padding: '5px 12px', background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Add item</button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Item {idx + 1}</span>
                    {items.length > 1 && <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Remove</button>}
                  </div>

                  <div style={{ marginBottom: '8px' }}><label style={lbl}>Description</label><input style={inp()} placeholder="MS Plate IS2062 Grade E250" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} /></div>

                  {grnType === 'plate' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div><label style={lbl}>Heat number *</label><input style={inp()} placeholder="H-2024-001" value={item.heat_number} onChange={e => updateItem(idx, 'heat_number', e.target.value)} /></div>
                        <div><label style={lbl}>Material grade *</label><select style={inp()} value={item.material_grade_id} onChange={e => updateItem(idx, 'material_grade_id', e.target.value)}><option value="">— Grade —</option>{grades.map(g => <option key={g.id} value={g.id}>{g.code}</option>)}</select></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div><label style={lbl}>Thickness (mm)</label><input style={inp()} type="number" placeholder="12" value={item.thickness_mm} onChange={e => updateItem(idx, 'thickness_mm', e.target.value)} /></div>
                        <div><label style={lbl}>Length (mm)</label><input style={inp()} type="number" placeholder="2000" value={item.length_mm} onChange={e => updateItem(idx, 'length_mm', e.target.value)} /></div>
                        <div><label style={lbl}>Width (mm)</label><input style={inp()} type="number" placeholder="1000" value={item.width_mm} onChange={e => updateItem(idx, 'width_mm', e.target.value)} /></div>
                        <div><label style={lbl}>Weight (kg)</label><input style={inp()} type="number" step="0.001" placeholder="188.4" value={item.weight_kg} onChange={e => updateItem(idx, 'weight_kg', e.target.value)} /></div>
                      </div>
                      {item.length_mm && item.width_mm && item.thickness_mm && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                          Auto weight: ~{Math.round(parseFloat(item.length_mm) * parseFloat(item.width_mm) * parseFloat(item.thickness_mm) * 7.85 / 1000000 * 100) / 100} kg
                          · Area: {Math.round(parseFloat(item.length_mm) * parseFloat(item.width_mm) / 1000)} cm²
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {grnType !== 'plate' && <div><label style={lbl}>Qty received</label><input style={inp()} type="number" value={item.qty_received} onChange={e => updateItem(idx, 'qty_received', e.target.value)} /></div>}
                    <div><label style={lbl}>Unit rate (₹)</label><input style={inp()} type="number" placeholder="0" value={item.unit_rate} onChange={e => updateItem(idx, 'unit_rate', e.target.value)} /></div>
                    <div><label style={lbl}>Store location</label><select style={inp()} value={item.location_id} onChange={e => updateItem(idx, 'location_id', e.target.value)}><option value="">— Location —</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp(), height: '60px', resize: 'none' as const }} placeholder="Any remarks..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={save} disabled={saving || !form.vendor_id} style={{ flex: 1, padding: '12px', background: form.vendor_id ? '#1e40af' : '#e5e7eb', color: form.vendor_id ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: form.vendor_id ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Creating GRN...' : 'Create GRN & receive materials'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
