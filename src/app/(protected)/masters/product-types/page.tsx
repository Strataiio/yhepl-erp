/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
const supabase = createClient()
export default function ProductTypesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [uoms, setUoms] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [form, setForm] = useState({ code:'', name:'', description:'', default_uom_id:'', material_grade_id:'' })

  async function load() {
    setLoading(true)
    const [{ data: r }, { data: u }, { data: g }] = await Promise.all([
      supabase.from('product_types').select('*, uom_master(code), material_grades(code)').order('name'),
      supabase.from('uom_master').select('id,code,name').order('code'),
      supabase.from('material_grades').select('id,code').order('code'),
    ])
    setRows(r||[]); setUoms(u||[]); setGrades(g||[]); setLoading(false)
  }
  useEffect(() => { load() }, [])
  function openNew() { setEditId(null); setForm({ code:'', name:'', description:'', default_uom_id:'', material_grade_id:'' }); setShowForm(true) }
  function openEdit(r: any) { setEditId(r.id); setForm({ code:r.code, name:r.name, description:r.description||'', default_uom_id:r.default_uom_id||'', material_grade_id:r.material_grade_id||'' }); setShowForm(true) }
  async function save() {
    setSaving(true)
    const payload = { code:form.code, name:form.name, description:form.description||null, default_uom_id:form.default_uom_id||null, material_grade_id:form.material_grade_id||null }
    if (editId) await (supabase.from('product_types') as any).update(payload).eq('id', editId)
    else await (supabase.from('product_types') as any).insert(payload)
    setSaving(false); setShowForm(false); load()
  }
  const inp = () => ({ padding:'8px 11px', fontSize:'13px', color:'#111827', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'7px', outline:'none', width:'100%', boxSizing:'border-box' as const })
  const lbl = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }
  return (
    <div style={{ padding:'32px', maxWidth:'900px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader title="Product types" subtitle="Products that move through buckets — blanks, dish ends, nozzles, assemblies"
        actions={<button onClick={openNew} style={{ padding:'9px 18px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>+ New product type</button>}
      />
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
            {['Code','Name','Description','UOM','Grade',''].map(h => <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No product types yet</td></tr>}
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'700', color:'#1e40af' }}>{r.code}</td>
                <td style={{ padding:'12px 16px', fontSize:'14px', color:'#111827', fontWeight:'500' }}>{r.name}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#6b7280' }}>{r.description||'—'}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.uom_master?.code||'—'}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.material_grades?.code||'—'}</td>
                <td style={{ padding:'12px 16px' }}><button onClick={() => openEdit(r)} style={{ padding:'5px 12px', fontSize:'12px', color:'#1e40af', background:'#eff6ff', border:'none', borderRadius:'6px', cursor:'pointer' }}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'440px', background:'#fff', borderRadius:'16px', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#111827', margin:0 }}>{editId?'Edit product type':'New product type'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', color:'#9ca3af', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Code</label><input style={inp()} placeholder="DISH-END-500" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} /></div>
              <div><label style={lbl}>Default UOM</label><select style={inp()} value={form.default_uom_id} onChange={e => setForm(f=>({...f,default_uom_id:e.target.value}))}><option value="">— Select —</option>{uoms.map(u => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}</select></div>
            </div>
            <div style={{ marginBottom:'14px' }}><label style={lbl}>Product name</label><input style={inp()} placeholder="Dish End 500 OD" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
            <div style={{ marginBottom:'14px' }}><label style={lbl}>Default material grade</label><select style={inp()} value={form.material_grade_id} onChange={e => setForm(f=>({...f,material_grade_id:e.target.value}))}><option value="">— Select —</option>{grades.map(g => <option key={g.id} value={g.id}>{g.code}</option>)}</select></div>
            <div style={{ marginBottom:'20px' }}><label style={lbl}>Description</label><textarea style={{ ...inp(), height:'60px', resize:'none' as const }} placeholder="Optional description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} /></div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'11px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>{saving?'Saving...':editId?'Save changes':'Create'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding:'11px 20px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
