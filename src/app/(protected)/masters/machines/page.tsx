/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
const supabase = createClient()
export default function MachinesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', machine_type:'', make:'', model:'', cost_per_hour:'', station_id:'', capacity_desc:'' })
  async function load() {
    setLoading(true)
    const [{ data:r }, { data:s }] = await Promise.all([
      supabase.from('machines').select('*, process_stations(name)').order('name'),
      supabase.from('process_stations').select('id,name').order('name'),
    ])
    setRows(r||[]); setStations(s||[]); setLoading(false)
  }
  useEffect(() => { load() }, [])
  function openNew() { setEditId(null); setForm({ code:'', name:'', machine_type:'', make:'', model:'', cost_per_hour:'', station_id:'', capacity_desc:'' }); setShowForm(true) }
  function openEdit(r: any) { setEditId(r.id); setForm({ code:r.code, name:r.name, machine_type:r.machine_type, make:r.make||'', model:r.model||'', cost_per_hour:r.cost_per_hour?.toString()||'', station_id:r.station_id||'', capacity_desc:r.capacity_desc||'' }); setShowForm(true) }
  async function save() {
    setSaving(true)
    const payload = { code:form.code, name:form.name, machine_type:form.machine_type, make:form.make||null, model:form.model||null, cost_per_hour:parseFloat(form.cost_per_hour)||0, station_id:form.station_id||null, capacity_desc:form.capacity_desc||null }
    if (editId) await (supabase.from('machines') as any).update(payload).eq('id', editId)
    else await (supabase.from('machines') as any).insert(payload)
    setSaving(false); setShowForm(false); load()
  }
  const inp = () => ({ padding:'8px 11px', fontSize:'13px', color:'#111827', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'7px', outline:'none', width:'100%', boxSizing:'border-box' as const })
  const lbl = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }
  return (
    <div style={{ padding:'32px', maxWidth:'1000px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader title="Machines & assets" subtitle="Machine registry — QR codes generated at creation"
        actions={<button onClick={openNew} style={{ padding:'9px 18px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>+ New machine</button>}
      />
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
            {['Code','Name','Type','Make / Model','Station','Cost/hr','QR',''].map(h => <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', color:'#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No machines yet</td></tr>}
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'600', color:'#374151' }}>{r.code}</td>
                <td style={{ padding:'12px 16px', fontSize:'14px', color:'#111827', fontWeight:'500' }}>{r.name}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#6b7280' }}>{r.machine_type}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{[r.make,r.model].filter(Boolean).join(' / ')||'—'}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.process_stations?.name||'—'}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'600', color:'#059669' }}>₹{r.cost_per_hour}/hr</td>
                <td style={{ padding:'12px 16px' }}>{r.qr_code ? <span style={{ fontSize:'11px', color:'#059669' }}>✓ QR</span> : <span style={{ fontSize:'11px', color:'#d1d5db' }}>—</span>}</td>
                <td style={{ padding:'12px 16px' }}><button onClick={() => openEdit(r)} style={{ padding:'5px 12px', fontSize:'12px', color:'#1e40af', background:'#eff6ff', border:'none', borderRadius:'6px', cursor:'pointer' }}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'480px', background:'#fff', borderRadius:'16px', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#111827', margin:0 }}>{editId?'Edit machine':'New machine'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', color:'#9ca3af', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Code</label><input style={inp()} placeholder="PLASMA-01" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} /></div>
              <div><label style={lbl}>Machine type</label><input style={inp()} placeholder="plasma_cutter" value={form.machine_type} onChange={e => setForm(f=>({...f,machine_type:e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom:'14px' }}><label style={lbl}>Machine name</label><input style={inp()} placeholder="Plasma Cutter 01" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Make</label><input style={inp()} placeholder="Hypertherm" value={form.make} onChange={e => setForm(f=>({...f,make:e.target.value}))} /></div>
              <div><label style={lbl}>Model</label><input style={inp()} placeholder="XPR300" value={form.model} onChange={e => setForm(f=>({...f,model:e.target.value}))} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Cost per hour (₹)</label><input style={inp()} type="number" placeholder="850" value={form.cost_per_hour} onChange={e => setForm(f=>({...f,cost_per_hour:e.target.value}))} /></div>
              <div><label style={lbl}>Station</label><select style={inp()} value={form.station_id} onChange={e => setForm(f=>({...f,station_id:e.target.value}))}><option value="">— Select —</option>{stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            <div style={{ marginBottom:'20px' }}><label style={lbl}>Capacity description</label><input style={inp()} placeholder="Max plate 3000x1500mm, 50mm thick" value={form.capacity_desc} onChange={e => setForm(f=>({...f,capacity_desc:e.target.value}))} /></div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'11px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>{saving?'Saving...':editId?'Save changes':'Create machine'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding:'11px 20px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
