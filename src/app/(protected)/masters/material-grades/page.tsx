/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

const supabase = createClient()
type Grade = { id:string; code:string; name:string; standard:string; ys_min:number|null; uts_min:number|null; is_active:boolean }

export default function MaterialGradesPage() {
  const [rows, setRows] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', standard:'IS', ys_min:'', uts_min:'', elongation_min:'', c_max:'', mn_max:'', notes:'' })

  async function load() { setLoading(true); const { data } = await supabase.from('material_grades').select('*').order('code'); setRows(data||[]); setLoading(false) }
  useEffect(() => { load() }, [])

  function openNew() { setEditId(null); setForm({ code:'', name:'', standard:'IS', ys_min:'', uts_min:'', elongation_min:'', c_max:'', mn_max:'', notes:'' }); setShowForm(true) }
  function openEdit(r: Grade) { setEditId(r.id); setForm({ code:r.code, name:r.name, standard:(r as any).standard||'IS', ys_min:(r as any).ys_min?.toString()||'', uts_min:(r as any).uts_min?.toString()||'', elongation_min:(r as any).elongation_min?.toString()||'', c_max:(r as any).c_max?.toString()||'', mn_max:(r as any).mn_max?.toString()||'', notes:(r as any).notes||'' }); setShowForm(true) }

  async function save() {
    setSaving(true)
    const payload = { code:form.code, name:form.name, standard:form.standard, ys_min:form.ys_min?parseFloat(form.ys_min):null, uts_min:form.uts_min?parseFloat(form.uts_min):null, elongation_min:form.elongation_min?parseFloat(form.elongation_min):null, c_max:form.c_max?parseFloat(form.c_max):null, mn_max:form.mn_max?parseFloat(form.mn_max):null, notes:form.notes||null }
    if (editId) await (supabase.from('material_grades') as any).update(payload).eq('id', editId)
    else await (supabase.from('material_grades') as any).insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  const inp = (w='100%') => ({ padding:'8px 11px', fontSize:'13px', color:'#111827', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'7px', outline:'none', width:w, boxSizing:'border-box' as const })
  const lbl = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }

  return (
    <div style={{ padding:'32px', maxWidth:'1000px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader title="Material grades" subtitle="IS / ASME / EN grades with composition and mechanical property limits"
        actions={<button onClick={openNew} style={{ padding:'9px 18px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>+ New grade</button>}
      />
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
            {['Code','Name','Standard','YS min (MPa)','UTS min (MPa)','Status',''].map(h => (
              <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No material grades yet — add IS2062, SA516 Grade 70 etc.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'700', color:'#1e40af' }}>{r.code}</td>
                <td style={{ padding:'12px 16px', fontSize:'14px', color:'#111827' }}>{r.name}</td>
                <td style={{ padding:'12px 16px' }}><span style={{ padding:'3px 10px', background:'#f0fdf4', color:'#065f46', borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{r.standard}</span></td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.ys_min ?? '—'}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.uts_min ?? '—'}</td>
                <td style={{ padding:'12px 16px' }}><span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:r.is_active?'#f0fdf4':'#f9fafb', color:r.is_active?'#065f46':'#6b7280' }}>{r.is_active?'Active':'Inactive'}</span></td>
                <td style={{ padding:'12px 16px' }}><button onClick={() => openEdit(r)} style={{ padding:'5px 12px', fontSize:'12px', color:'#1e40af', background:'#eff6ff', border:'none', borderRadius:'6px', cursor:'pointer' }}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'500px', background:'#fff', borderRadius:'16px', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#111827', margin:0 }}>{editId?'Edit grade':'New material grade'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', color:'#9ca3af', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Grade code</label><input style={inp()} placeholder="IS2062_E250" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} /></div>
              <div><label style={lbl}>Standard</label><select style={inp()} value={form.standard} onChange={e => setForm(f=>({...f,standard:e.target.value}))}><option>IS</option><option>ASME</option><option>EN</option><option>AWS</option><option>DIN</option></select></div>
            </div>
            <div style={{ marginBottom:'14px' }}><label style={lbl}>Grade name</label><input style={inp()} placeholder="IS 2062 Grade E250 BR" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:'14px', marginBottom:'14px' }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#6b7280', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Mechanical properties</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                <div><label style={lbl}>YS min (MPa)</label><input style={inp()} type="number" placeholder="250" value={form.ys_min} onChange={e => setForm(f=>({...f,ys_min:e.target.value}))} /></div>
                <div><label style={lbl}>UTS min (MPa)</label><input style={inp()} type="number" placeholder="410" value={form.uts_min} onChange={e => setForm(f=>({...f,uts_min:e.target.value}))} /></div>
                <div><label style={lbl}>Elongation min %</label><input style={inp()} type="number" placeholder="23" value={form.elongation_min} onChange={e => setForm(f=>({...f,elongation_min:e.target.value}))} /></div>
              </div>
            </div>
            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:'14px', marginBottom:'14px' }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#6b7280', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Chemical composition limits</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div><label style={lbl}>C max %</label><input style={inp()} type="number" step="0.001" placeholder="0.23" value={form.c_max} onChange={e => setForm(f=>({...f,c_max:e.target.value}))} /></div>
                <div><label style={lbl}>Mn max %</label><input style={inp()} type="number" step="0.001" placeholder="1.50" value={form.mn_max} onChange={e => setForm(f=>({...f,mn_max:e.target.value}))} /></div>
              </div>
            </div>
            <div style={{ marginBottom:'20px' }}><label style={lbl}>Notes</label><textarea style={{ ...inp(), height:'70px', resize:'none' as const }} placeholder="Additional notes or specifications" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} /></div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'11px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>{saving?'Saving...':editId?'Save changes':'Create grade'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding:'11px 20px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
