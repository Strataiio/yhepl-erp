/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

const supabase = createClient()
type Station = { id:string; code:string; name:string; capacity_hrs_per_shift:number; shifts_per_day:number; plant_area:string|null; is_active:boolean }

export default function ProcessStationsPage() {
  const [rows, setRows] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', capacity_hrs_per_shift:'8', shifts_per_day:'1', plant_area:'' })

  async function load() { setLoading(true); const { data } = await supabase.from('process_stations').select('*').order('name'); setRows(data||[]); setLoading(false) }
  useEffect(() => { load() }, [])

  function openNew() { setEditId(null); setForm({ code:'', name:'', capacity_hrs_per_shift:'8', shifts_per_day:'1', plant_area:'' }); setShowForm(true) }
  function openEdit(r: Station) { setEditId(r.id); setForm({ code:r.code, name:r.name, capacity_hrs_per_shift:r.capacity_hrs_per_shift.toString(), shifts_per_day:r.shifts_per_day.toString(), plant_area:r.plant_area||'' }); setShowForm(true) }

  async function save() {
    setSaving(true)
    const payload = { code:form.code, name:form.name, capacity_hrs_per_shift:parseFloat(form.capacity_hrs_per_shift), shifts_per_day:parseInt(form.shifts_per_day), plant_area:form.plant_area||null }
    if (editId) await (supabase.from('process_stations') as any).update(payload).eq('id', editId)
    else await (supabase.from('process_stations') as any).insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  const inp = (w='100%') => ({ padding:'8px 11px', fontSize:'13px', color:'#111827', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'7px', outline:'none', width:w, boxSizing:'border-box' as const })
  const lbl = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }

  return (
    <div style={{ padding:'32px', maxWidth:'900px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader title="Process stations" subtitle="Shop floor stations — capacity drives the constraint model"
        actions={<button onClick={openNew} style={{ padding:'9px 18px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>+ New station</button>}
      />
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
            {['Code','Station name','Capacity/shift','Shifts/day','Daily capacity','Area',''].map(h => (
              <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No stations yet</td></tr>}
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'600', color:'#374151' }}>{r.code}</td>
                <td style={{ padding:'12px 16px', fontSize:'14px', color:'#111827', fontWeight:'500' }}>{r.name}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.capacity_hrs_per_shift} hrs</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.shifts_per_day}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'600', color:'#1e40af' }}>{r.capacity_hrs_per_shift * r.shifts_per_day} hrs/day</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#6b7280' }}>{r.plant_area||'—'}</td>
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
              <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#111827', margin:0 }}>{editId?'Edit station':'New station'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', color:'#9ca3af', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Code</label><input style={inp()} placeholder="WLD-01" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} /></div>
              <div><label style={lbl}>Plant area</label><input style={inp()} placeholder="Bay 2" value={form.plant_area} onChange={e => setForm(f=>({...f,plant_area:e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom:'14px' }}><label style={lbl}>Station name</label><input style={inp()} placeholder="Welding Bay 1" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'22px' }}>
              <div><label style={lbl}>Capacity (hrs/shift)</label><input style={inp()} type="number" step="0.5" value={form.capacity_hrs_per_shift} onChange={e => setForm(f=>({...f,capacity_hrs_per_shift:e.target.value}))} /></div>
              <div><label style={lbl}>Shifts per day</label><select style={inp()} value={form.shifts_per_day} onChange={e => setForm(f=>({...f,shifts_per_day:e.target.value}))}><option value="1">1 shift</option><option value="2">2 shifts</option><option value="3">3 shifts</option></select></div>
            </div>
            <div style={{ background:'#eff6ff', borderRadius:'8px', padding:'12px 14px', marginBottom:'20px' }}>
              <div style={{ fontSize:'12px', color:'#1e40af', fontWeight:'600' }}>Daily capacity: {(parseFloat(form.capacity_hrs_per_shift||'0') * parseInt(form.shifts_per_day||'1')).toFixed(1)} hrs</div>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'11px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>{saving?'Saving...':editId?'Save changes':'Create station'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding:'11px 20px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
