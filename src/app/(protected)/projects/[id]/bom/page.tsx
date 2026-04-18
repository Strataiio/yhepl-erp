/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet, apiSave, inp, lbl } from '@/lib/api'

export default function AddBomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [assemblies, setAssemblies] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [uoms, setUoms] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [existingBom, setExistingBom] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    product_type_id: '', qty: '', uom_id: '', assembly_id: '',
    material_grade_id: '', drawing_ref: '', part_number: '', notes: ''
  })

  useEffect(() => {
    Promise.all([
      apiGet('assemblies', { filter: `project_id=${id}`, order: 'name', asc: true }),
      apiGet('product_types', { order: 'name', asc: true }),
      apiGet('uom_master', { order: 'code', asc: true }),
      apiGet('material_grades', { order: 'code', asc: true }),
      apiGet('project_bom', { filter: `project_id=${id}`, order: 'line_number', asc: true }),
    ]).then(([asm, prod, uom, grd, bom]) => {
      setAssemblies(asm); setProducts(prod); setUoms(uom); setGrades(grd); setExistingBom(bom)
    })
  }, [id])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.product_type_id) { setError('Select a product type'); return }
    if (!form.qty) { setError('Quantity is required'); return }
    setSaving(true); setError('')
    try {
      const nextLine = (existingBom.length > 0 ? Math.max(...existingBom.map(b => b.line_number)) : 0) + 1
      const payload: any = {
        project_id: id,
        line_number: nextLine,
        product_type_id: form.product_type_id,
        qty: parseFloat(form.qty),
      }
      if (form.uom_id) payload.uom_id = form.uom_id
      if (form.assembly_id) payload.assembly_id = form.assembly_id
      if (form.material_grade_id) payload.material_grade_id = form.material_grade_id
      if (form.drawing_ref) payload.drawing_ref = form.drawing_ref
      if (form.part_number) payload.part_number = form.part_number
      if (form.notes) payload.notes = form.notes
      await apiSave('project_bom', payload)
      router.push(`/projects/${id}`)
    } catch(e) { setError(String(e)); setSaving(false) }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '640px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.push(`/projects/${id}`)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: '6px 0' }}>← Project</button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Add BOM line</h1>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '28px' }}>
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: '#64748b' }}>
          Line {existingBom.length + 1} · {existingBom.length} existing BOM lines
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Product type *</label>
          <select style={inp()} value={form.product_type_id} onChange={e => set('product_type_id', e.target.value)}>
            <option value="">— Select product —</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
          {products.length === 0 && <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>No products found — add them in Masters → Product types first</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Quantity *</label>
            <input style={inp()} type="number" step="0.01" placeholder="4" value={form.qty} onChange={e => set('qty', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>UOM</label>
            <select style={inp()} value={form.uom_id} onChange={e => set('uom_id', e.target.value)}>
              <option value="">— Select UOM —</option>
              {uoms.map(u => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Assembly</label>
            <select style={inp()} value={form.assembly_id} onChange={e => set('assembly_id', e.target.value)}>
              <option value="">— Project level —</option>
              {assemblies.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Material grade</label>
            <select style={inp()} value={form.material_grade_id} onChange={e => set('material_grade_id', e.target.value)}>
              <option value="">— Any / as per drawing —</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.code}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Drawing ref</label>
            <input style={inp()} placeholder="DRW-001/Sh-2" value={form.drawing_ref} onChange={e => set('drawing_ref', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Part number</label>
            <input style={inp()} placeholder="PN-0042" value={form.part_number} onChange={e => set('part_number', e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={lbl}>Notes</label>
          <textarea style={{ ...inp(), height: '60px', resize: 'none' }} placeholder="Optional notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Add to BOM'}
          </button>
          <button onClick={() => router.push(`/projects/${id}`)} style={{ padding: '12px 24px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
