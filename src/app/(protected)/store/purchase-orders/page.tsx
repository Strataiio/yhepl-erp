/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function PurchaseOrdersPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ vendor_id: '', project_id: '', delivery_date: '', payment_terms: 'Net 30 days', notes: '' })
  const [items, setItems] = useState([{ description: '', qty_ordered: '1', unit_rate: '', gst_rate: '18' }])

  async function load() { setLoading(true); const r = await fetch('/api/store/po'); if (r.ok) setRows(await r.json()); setLoading(false) }
  useEffect(() => {
    load()
    fetch('/api/masters?table=vendors&order=name').then(r => r.json()).then(setVendors)
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])

  const total = items.reduce((s, i) => s + (parseFloat(i.qty_ordered || '0') * parseFloat(i.unit_rate || '0')), 0)
  const gst = total * 0.18
  const grand = total + gst

  async function save() {
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/store/po', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items: items.map(i => ({ ...i, qty_ordered: parseFloat(i.qty_ordered), unit_rate: parseFloat(i.unit_rate), gst_rate: parseFloat(i.gst_rate) })) }) })
      if (!r.ok) throw new Error(await r.text())
      setShowForm(false); load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const STATUS_CFG: Record<string, any> = {
    draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
    approved: { bg: '#eff6ff', color: '#1e40af', label: 'Approved' },
    sent: { bg: '#faf5ff', color: '#6b21a8', label: 'Sent' },
    partially_received: { bg: '#fffbeb', color: '#92400e', label: 'Partial GRN' },
    fully_received: { bg: '#f0fdf4', color: '#065f46', label: 'Fully received' },
    cancelled: { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
  }
  const inp = (style: any = {}) => ({ padding: '8px 10px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '10px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div><h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Purchase orders</h1><p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Create POs to vendors — linked to GRN on receipt</p></div>
        <button onClick={() => { setShowForm(true); setError('') }} style={{ padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ New PO</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['PO number', 'Vendor', 'Project', 'Date', 'Grand total', 'Status', 'Zoho'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No purchase orders yet</td></tr>}
            {rows.map(r => {
              const cfg = STATUS_CFG[r.status] || STATUS_CFG.draft
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{r.po_number}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{r.vendors?.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280' }}>{r.project_id ? '—' : '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{r.po_date ? new Date(r.po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{r.grand_total ? `₹${r.grand_total.toLocaleString('en-IN')}` : '—'}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                  <td style={{ padding: '12px 14px', fontSize: '11px', color: r.zoho_sync_status === 'synced' ? '#059669' : '#d97706' }}>{r.zoho_sync_status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '600px', height: '100vh', background: '#fff', overflowY: 'auto', padding: '28px', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>New purchase order</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>
            {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div><label style={lbl}>Vendor *</label><select style={inp()} value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}><option value="">— Select vendor —</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div><label style={lbl}>Delivery date</label><input style={inp()} type="date" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div><label style={lbl}>Link to project</label><select style={inp()} value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}><option value="">— None —</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}</select></div>
              <div><label style={lbl}>Payment terms</label><input style={inp()} value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} /></div>
            </div>

            {/* Line items */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Line items</div>
                <button onClick={() => setItems(i => [...i, { description: '', qty_ordered: '1', unit_rate: '', gst_rate: '18' }])}
                  style={{ padding: '4px 10px', background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>+ Add line</button>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 20px', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
                  <div><label style={lbl}>Description</label><input style={inp()} placeholder="MS Plate 12mm" value={item.description} onChange={e => setItems(is => is.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} /></div>
                  <div><label style={lbl}>Qty</label><input style={inp()} type="number" value={item.qty_ordered} onChange={e => setItems(is => is.map((x, j) => j === i ? { ...x, qty_ordered: e.target.value } : x))} /></div>
                  <div><label style={lbl}>Rate (₹)</label><input style={inp()} type="number" value={item.unit_rate} onChange={e => setItems(is => is.map((x, j) => j === i ? { ...x, unit_rate: e.target.value } : x))} /></div>
                  <div><label style={lbl}>GST %</label><input style={inp()} type="number" value={item.gst_rate} onChange={e => setItems(is => is.map((x, j) => j === i ? { ...x, gst_rate: e.target.value } : x))} /></div>
                  {items.length > 1 && <button onClick={() => setItems(is => is.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', paddingBottom: '2px' }}>×</button>}
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}><span style={{ color: '#6b7280' }}>Subtotal</span><span style={{ fontWeight: '600' }}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}><span style={{ color: '#6b7280' }}>GST (18%)</span><span style={{ fontWeight: '600' }}>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}><span style={{ fontWeight: '700', color: '#0f172a' }}>Grand total</span><span style={{ fontWeight: '700', color: '#1e40af' }}>₹{grand.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={save} disabled={saving || !form.vendor_id} style={{ flex: 1, padding: '12px', background: form.vendor_id ? '#1e40af' : '#e5e7eb', color: form.vendor_id ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: form.vendor_id ? 'pointer' : 'not-allowed' }}>{saving ? 'Creating...' : 'Create PO'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
