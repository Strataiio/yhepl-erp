/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet, apiSave, inp, lbl } from '@/lib/api'

export default function AddAssemblyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [existingAssemblies, setExistingAssemblies] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '', name: '', assembly_level: '1',
    parent_assembly_id: '', drawing_number: '', process_route_id: '', notes: ''
  })

  useEffect(() => {
    apiGet('assemblies', { filter: `project_id=${id}`, order: 'name', asc: true }).then(setExistingAssemblies)
    apiGet('process_routes', { order: 'name', asc: true }).then(setRoutes)
  }, [id])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.code.trim() || !form.name.trim()) { setError('Code and name are required'); return }
    setSaving(true); setError('')
    try {
      const payload: any = {
        project_id: id,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        assembly_level: parseInt(form.assembly_level),
      }
      if (form.parent_assembly_id) payload.parent_assembly_id = form.parent_assembly_id
      if (form.drawing_number) payload.drawing_number = form.drawing_number
      if (form.process_route_id) payload.process_route_id = form.process_route_id
      if (form.notes) payload.notes = form.notes
      await apiSave('assemblies', payload)
      router.push(`/projects/${id}?tab=assemblies`)
    } catch(e) { setError(String(e)); setSaving(false) }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '600px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.push(`/projects/${id}`)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: '6px 0' }}>← Project</button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Add assembly</h1>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Code *</label>
            <input style={inp()} placeholder="SHELL-ASM" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label style={lbl}>Assembly level</label>
            <select style={inp()} value={form.assembly_level} onChange={e => set('assembly_level', e.target.value)}>
              <option value="1">1 — Assembly</option>
              <option value="2">2 — Sub-assembly</option>
              <option value="3">3 — Component</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Name *</label>
          <input style={inp()} placeholder="Main Shell Assembly" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>

        {parseInt(form.assembly_level) > 1 && existingAssemblies.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Parent assembly</label>
            <select style={inp()} value={form.parent_assembly_id} onChange={e => set('parent_assembly_id', e.target.value)}>
              <option value="">— No parent (top-level) —</option>
              {existingAssemblies.filter(a => a.assembly_level < parseInt(form.assembly_level)).map(a => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Drawing number</label>
            <input style={inp()} placeholder="DRW-001 Rev A" value={form.drawing_number} onChange={e => set('drawing_number', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Process route</label>
            <select style={inp()} value={form.process_route_id} onChange={e => set('process_route_id', e.target.value)}>
              <option value="">— Assign later —</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={lbl}>Notes</label>
          <textarea style={{ ...inp(), height: '70px', resize: 'none' }} placeholder="Optional notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Add assembly'}
          </button>
          <button onClick={() => router.push(`/projects/${id}`)} style={{ padding: '12px 24px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
