/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PROJECT_TYPES = ['pressure_vessel', 'heat_exchanger', 'storage_tank', 'structural_fabrication', 'piping', 'custom']
const APPLICABLE_CODES = ['ASME_VIII_Div1', 'ASME_VIII_Div2', 'IS_2825', 'IS_4503', 'AWS_D1_1', 'IBR', 'None']

export default function NewProjectPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    customer_id: '',
    po_number: '',
    po_date: '',
    contract_value: '',
    delivery_date: '',
    project_type: '',
    applicable_code: '',
    description: '',
    status: 'order_confirmed',
  })

  useEffect(() => {
    fetch('/api/masters?table=customers&order=name')
      .then(r => r.json()).then(setCustomers).catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.customer_id) { setError('Project name and customer are required'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        contract_value: form.contract_value ? parseFloat(form.contract_value) : null,
        po_date: form.po_date || null,
        delivery_date: form.delivery_date || null,
        project_type: form.project_type || null,
        applicable_code: form.applicable_code || null,
        description: form.description || null,
        po_number: form.po_number || null,
      }
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) throw new Error(await r.text())
      const project = await r.json()
      router.push(`/projects/${project.id}`)
    } catch (e) { setError(String(e)); setSaving(false) }
  }

  const inp = (style: any = {}) => ({
    padding: '9px 12px', fontSize: '13px', color: '#111827', background: '#fff',
    border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none',
    width: '100%', boxSizing: 'border-box' as const, ...style
  })
  const lbl = { fontSize: '12px', fontWeight: '600' as const, color: '#374151', display: 'block' as const, marginBottom: '6px' }
  const field = { marginBottom: '18px' }

  return (
    <div style={{ padding: '32px', maxWidth: '720px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.back()} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>← Back</button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>New project</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Project code will be auto-generated</p>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

      <form onSubmit={submit}>
        {/* Section 1 — Core info */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>Project details</div>

          <div style={field}>
            <label style={lbl}>Project name *</label>
            <input style={inp()} placeholder="e.g. 2 x 10 KL Pressure Vessel for BPCL" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={field}>
              <label style={lbl}>Customer *</label>
              <select style={inp()} value={form.customer_id} onChange={e => set('customer_id', e.target.value)} required>
                <option value="">— Select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {customers.length === 0 && <p style={{ fontSize: '11px', color: '#f59e0b', margin: '4px 0 0' }}>No customers found — <a href="/masters/customers" style={{ color: '#1e40af' }}>add one first</a></p>}
            </div>
            <div style={field}>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="enquiry">Enquiry</option>
                <option value="order_confirmed">Order confirmed</option>
                <option value="planning">Planning</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={field}>
              <label style={lbl}>Project type</label>
              <select style={inp()} value={form.project_type} onChange={e => set('project_type', e.target.value)}>
                <option value="">— Select type —</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={field}>
              <label style={lbl}>Applicable code</label>
              <select style={inp()} value={form.applicable_code} onChange={e => set('applicable_code', e.target.value)}>
                <option value="">— Select code —</option>
                {APPLICABLE_CODES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <div style={field}>
            <label style={lbl}>Description / scope of work</label>
            <textarea
              style={{ ...inp(), height: '80px', resize: 'vertical' as const }}
              placeholder="Brief description of what's being fabricated..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </div>

        {/* Section 2 — PO & Delivery */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>Purchase order & delivery</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={field}>
              <label style={lbl}>PO number</label>
              <input style={inp()} placeholder="PO/2024/001" value={form.po_number} onChange={e => set('po_number', e.target.value)} />
            </div>
            <div style={field}>
              <label style={lbl}>PO date</label>
              <input style={inp()} type="date" value={form.po_date} onChange={e => set('po_date', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={field}>
              <label style={lbl}>Contract value (₹)</label>
              <input style={inp()} type="number" placeholder="2500000" value={form.contract_value} onChange={e => set('contract_value', e.target.value)} />
              {form.contract_value && <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>₹{(parseFloat(form.contract_value) / 100000).toFixed(2)} Lakhs</p>}
            </div>
            <div style={field}>
              <label style={lbl}>Delivery date *</label>
              <input style={inp()} type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{ flex: 1, padding: '13px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Creating project...' : 'Create project →'}
          </button>
          <button type="button" onClick={() => router.back()} style={{ padding: '13px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
