/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

const STATUS_CFG: Record<string, any> = {
  open:       { label: 'Open',        bg: '#fef2f2', color: '#dc2626' },
  under_capa: { label: 'Under CAPA',  bg: '#fffbeb', color: '#d97706' },
  capa_done:  { label: 'CAPA done',   bg: '#eff6ff', color: '#1e40af' },
  closed:     { label: 'Closed',      bg: '#f0fdf4', color: '#059669' },
  rejected:   { label: 'Rejected',    bg: '#f3f4f6', color: '#6b7280' },
}

const DISPOSITION_OPTIONS = ['rework','repair','reject','use_as_is','return_to_vendor']

export default function NCRPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [capaForm, setCapaForm] = useState({ corrective_action: '', preventive_action: '', target_date: '' })

  async function load() {
    setLoading(true)
    const r = await fetch('/api/quality/ncr')
    if (r.ok) setRows(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function updateNCR(id: string, updates: any) {
    setSaving(true); setError('')
    try {
      const r = await fetch(`/api/quality/ncr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
      if (!r.ok) throw new Error(await r.text())
      await load()
      const updated = rows.find(r => r.id === id)
      if (updated) setSelected({ ...updated, ...updates })
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function saveCAPA(ncrId: string) {
    setSaving(true); setError('')
    try {
      const r = await fetch(`/api/quality/ncr/${ncrId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_capa', capa: { ...capaForm, target_date: capaForm.target_date || null } })
      })
      if (!r.ok) throw new Error(await r.text())
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const filtered = rows.filter(r => statusFilter === 'all' || r.status === statusFilter)
  const counts = rows.reduce((a: any, r) => { a[r.status] = (a[r.status] || 0) + 1; return a }, {})
  const inp = (style: any = {}) => ({ padding: '8px 11px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>
      {/* NCR list */}
      <div style={{ width: '400px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px' }}>NCR & CAPA</h1>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
            {[['all', 'All'], ['open', 'Open'], ['under_capa', 'CAPA'], ['closed', 'Closed']].map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)}
                style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer', background: statusFilter === k ? '#0f172a' : '#f1f5f9', color: statusFilter === k ? '#fff' : '#475569' }}>
                {l} {k !== 'all' && counts[k] ? `(${counts[k]})` : k === 'all' ? `(${rows.length})` : ''}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Loading...</div>}
          {!loading && filtered.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No NCRs {statusFilter !== 'all' ? `with status: ${statusFilter}` : ''}</div>}
          {filtered.map(ncr => {
            const cfg = STATUS_CFG[ncr.status] || STATUS_CFG.open
            return (
              <div key={ncr.id} onClick={() => { setSelected(ncr); setCapaForm({ corrective_action: ncr.capa?.[0]?.corrective_action || '', preventive_action: ncr.capa?.[0]?.preventive_action || '', target_date: ncr.capa?.[0]?.target_date || '' }) }}
                style={{ background: selected?.id === ncr.id ? '#eff6ff' : '#fff', border: `1px solid ${selected?.id === ncr.id ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '10px', padding: '12px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.12s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>{ncr.ncr_number}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#111827', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ncr.defect_description}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{ncr.projects?.project_code} · {ncr.buckets?.bucket_code}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{ncr.raised_by_profile?.full_name} · {new Date(ncr.raised_at).toLocaleDateString('en-IN')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* NCR detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', opacity: 0.3, marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>Select an NCR to view and manage</div>
          </div>
        ) : (
          <div style={{ maxWidth: '640px' }}>
            {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '16px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>{selected.ncr_number}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{selected.projects?.project_code} · {selected.buckets?.bucket_code} · Raised by {selected.raised_by_profile?.full_name}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selected.status !== 'closed' && (
                  <button onClick={() => updateNCR(selected.id, { status: 'closed' })} disabled={saving}
                    style={{ padding: '7px 14px', background: '#f0fdf4', color: '#065f46', border: '1px solid #86efac', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    ✓ Close NCR
                  </button>
                )}
              </div>
            </div>

            {/* Defect info */}
            <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Defect description</div>
              <div style={{ fontSize: '13px', color: '#374151' }}>{selected.defect_description}</div>
            </div>

            {/* Failed parameters */}
            {selected.failed_parameters?.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Failed parameters</div>
                {selected.failed_parameters.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                    <span style={{ color: '#374151', fontWeight: '500' }}>{p.field_name}</span>
                    <div style={{ textAlign: 'right' as const }}>
                      <span style={{ color: '#dc2626', fontWeight: '700' }}>{p.value} {p.unit}</span>
                      <span style={{ color: '#9ca3af', fontSize: '11px', marginLeft: '8px' }}>
                        (spec: {p.spec_min !== null && p.spec_min !== undefined ? `${p.spec_min}` : '—'} – {p.spec_max !== null && p.spec_max !== undefined ? `${p.spec_max}` : '—'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Disposition */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Disposition</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {DISPOSITION_OPTIONS.map(d => (
                  <button key={d} onClick={() => updateNCR(selected.id, { disposition: d })} disabled={saving}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${selected.disposition === d ? '#1e40af' : '#e5e7eb'}`, background: selected.disposition === d ? '#eff6ff' : '#fff', color: selected.disposition === d ? '#1e40af' : '#6b7280', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {d.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* CAPA */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>CAPA — corrective & preventive action</div>
              {selected.capa?.[0]?.is_closed && (
                <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px', fontSize: '12px', color: '#065f46', fontWeight: '600' }}>✓ CAPA closed</div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Corrective action *</label>
                <textarea style={{ ...inp(), height: '70px', resize: 'none' as const }} placeholder="What was done to correct this specific defect?" value={capaForm.corrective_action} onChange={e => setCapaForm(f => ({ ...f, corrective_action: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Preventive action</label>
                <textarea style={{ ...inp(), height: '60px', resize: 'none' as const }} placeholder="What will prevent recurrence?" value={capaForm.preventive_action} onChange={e => setCapaForm(f => ({ ...f, preventive_action: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div><label style={lbl}>Target date</label><input style={inp()} type="date" value={capaForm.target_date} onChange={e => setCapaForm(f => ({ ...f, target_date: e.target.value }))} /></div>
              </div>
              <button onClick={() => saveCAPA(selected.id)} disabled={saving || !capaForm.corrective_action}
                style={{ padding: '9px 20px', background: capaForm.corrective_action ? '#1e40af' : '#e5e7eb', color: capaForm.corrective_action ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: capaForm.corrective_action ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Saving...' : 'Save CAPA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
