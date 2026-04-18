/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiSave, inp, lbl } from '@/lib/api'

const PROJECT_TYPES = ['Pressure Vessel','Heat Exchanger','Storage Tank','Structural','Reactor','Custom']
const CODES = ['ASME_VIII','IS_2825','IS_2062','AWS_D1_1','IS_875','Custom']

export default function NewProjectPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', customer_id: '', po_number: '', po_date: '',
    contract_value: '', delivery_date: '', project_type: '',
    applicable_code: '', description: '', status: 'enquiry'
  })

  useEffect(() => {
    apiGet('customers', { order: 'name', asc: true }).then(setCustomers).catch(() => {})
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) { setError('Project name is required'); return }
    if (!form.customer_id) { setError('Select a customer'); return }
    setSaving(true); setError('')
    try {
      const payload: any = {
        name: form.name.trim(),
        customer_id: form.customer_id,
        status: form.status,
      }
      if (form.po_number) payload.po_number = form.po_number
      if (form.po_date) payload.po_date = form.po_date
      if (form.contract_value) payload.contract_value = parseFloat(form.contract_value)
      if (form.delivery_date) payload.delivery_date = form.delivery_date
      if (form.project_type) payload.project_type = form.project_type
      if (form.applicable_code) payload.applicable_code = form.applicable_code
      if (form.description) payload.description = form.description

      const saved = await apiSave('projects', payload)
      router.push(`/projects/${saved.id}`)
    } catch(e) { setError(String(e)); setSaving(false) }
  }

  const S = { section: { marginBottom: '28px' } as React.CSSProperties, sectionTitle: { fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }, grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } as React.CSSProperties, grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' } as React.CSSProperties }

  return (
    <div style={{ padding: '32px', maxWidth: '760px', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: '6px 0' }}>← Projects</button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>New project</h1>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '28px' }}>

        {/* Basic details */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Project details</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Project name *</label>
            <input style={inp()} placeholder="500mm Dia Pressure Vessel for BPCL" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div style={S.grid2}>
            <div>
              <label style={lbl}>Customer *</label>
              <select style={inp()} value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
                <option value="">— Select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
              {customers.length === 0 && <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>No customers found — add one in Masters first</div>}
            </div>
            <div>
              <label style={lbl}>Project type</label>
              <select style={inp()} value={form.project_type} onChange={e => set('project_type', e.target.value)}>
                <option value="">— Select type —</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Order details */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Order details</div>
          <div style={S.grid3}>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="enquiry">Enquiry</option>
                <option value="order_confirmed">Order confirmed</option>
                <option value="planning">Planning</option>
              </select>
            </div>
            <div>
              <label style={lbl}>PO number</label>
              <input style={inp()} placeholder="PO/2024/0142" value={form.po_number} onChange={e => set('po_number', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>PO date</label>
              <input style={inp()} type="date" value={form.po_date} onChange={e => set('po_date', e.target.value)} />
            </div>
          </div>
          <div style={{ ...S.grid2, marginTop: '16px' }}>
            <div>
              <label style={lbl}>Contract value (₹)</label>
              <input style={inp()} type="number" placeholder="2500000" value={form.contract_value} onChange={e => set('contract_value', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Delivery date</label>
              <input style={inp()} type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Technical */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Technical</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Applicable code / standard</label>
            <select style={inp()} value={form.applicable_code} onChange={e => set('applicable_code', e.target.value)}>
              <option value="">— Select code —</option>
              {CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Description / scope of supply</label>
            <textarea
              style={{ ...inp(), height: '80px', resize: 'none' }}
              placeholder="Brief description of the project scope..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creating project...' : 'Create project →'}
          </button>
          <button onClick={() => router.push('/projects')} style={{ padding: '12px 24px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
