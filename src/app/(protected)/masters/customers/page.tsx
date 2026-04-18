/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

const supabase = createClient()
type Customer = { id:string; code:string; name:string; gstin:string|null; city:string|null; state:string|null; contact_person:string|null; phone:string|null; credit_terms_days:number; is_active:boolean }

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', gstin:'', pan:'', address_line1:'', city:'', state:'', pincode:'', contact_person:'', phone:'', email:'', credit_terms_days:'30' })

  async function load() { setLoading(true); const { data } = await supabase.from('customers').select('*').order('name'); setRows(data||[]); setLoading(false) }
  useEffect(() => { load() }, [])
  function openNew() { setEditId(null); setForm({ code:'', name:'', gstin:'', pan:'', address_line1:'', city:'', state:'', pincode:'', contact_person:'', phone:'', email:'', credit_terms_days:'30' }); setShowForm(true) }
  function openEdit(r: Customer) { setEditId(r.id); setForm({ code:r.code, name:r.name, gstin:r.gstin||'', pan:(r as any).pan||'', address_line1:(r as any).address_line1||'', city:r.city||'', state:r.state||'', pincode:(r as any).pincode||'', contact_person:r.contact_person||'', phone:r.phone||'', email:(r as any).email||'', credit_terms_days:r.credit_terms_days.toString() }); setShowForm(true) }

  async function save() {
    setSaving(true)
    const payload = { ...form, credit_terms_days:parseInt(form.credit_terms_days), gstin:form.gstin||null, pan:form.pan||null, city:form.city||null, state:form.state||null, phone:form.phone||null, email:form.email||null, contact_person:form.contact_person||null }
    if (editId) await (supabase.from('customers') as any).update(payload).eq('id', editId)
    else await (supabase.from('customers') as any).insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  const inp = (w='100%') => ({ padding:'8px 11px', fontSize:'13px', color:'#111827', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'7px', outline:'none', width:w, boxSizing:'border-box' as const })
  const lbl = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }

  return (
    <div style={{ padding:'32px', maxWidth:'1000px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader title="Customers" subtitle="Customer master — used when creating projects"
        actions={<button onClick={openNew} style={{ padding:'9px 18px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>+ New customer</button>}
      />
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
            {['Code','Name','GSTIN','City','Contact','Credit terms',''].map(h => (
              <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No customers yet</td></tr>}
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'600', color:'#374151' }}>{r.code}</td>
                <td style={{ padding:'12px 16px', fontSize:'14px', color:'#111827', fontWeight:'500' }}>{r.name}</td>
                <td style={{ padding:'12px 16px', fontSize:'12px', color:'#6b7280', fontFamily:'monospace' }}>{r.gstin||'—'}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.city||'—'}{r.state?`, ${r.state}`:''}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.contact_person||'—'}{r.phone?` · ${r.phone}`:''}</td>
                <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{r.credit_terms_days} days</td>
                <td style={{ padding:'12px 16px' }}><button onClick={() => openEdit(r)} style={{ padding:'5px 12px', fontSize:'12px', color:'#1e40af', background:'#eff6ff', border:'none', borderRadius:'6px', cursor:'pointer' }}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'flex-end' }}>
          <div style={{ width:'480px', height:'100vh', background:'#fff', overflowY:'auto', padding:'28px', boxShadow:'-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#111827', margin:0 }}>{editId?'Edit customer':'New customer'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', color:'#9ca3af', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Code</label><input style={inp()} placeholder="CUST-001" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} /></div>
              <div><label style={lbl}>Credit terms (days)</label><input style={inp()} type="number" value={form.credit_terms_days} onChange={e => setForm(f=>({...f,credit_terms_days:e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom:'14px' }}><label style={lbl}>Company name</label><input style={inp()} placeholder="Bharat Petroleum Corp Ltd" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>GSTIN</label><input style={inp()} placeholder="33AAAAA0000A1Z5" value={form.gstin} onChange={e => setForm(f=>({...f,gstin:e.target.value.toUpperCase()}))} /></div>
              <div><label style={lbl}>PAN</label><input style={inp()} placeholder="AAAAA0000A" value={form.pan} onChange={e => setForm(f=>({...f,pan:e.target.value.toUpperCase()}))} /></div>
            </div>
            <div style={{ marginBottom:'14px' }}><label style={lbl}>Address</label><input style={inp()} placeholder="123 Industrial Area" value={form.address_line1} onChange={e => setForm(f=>({...f,address_line1:e.target.value}))} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>City</label><input style={inp()} placeholder="Coimbatore" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} /></div>
              <div><label style={lbl}>State</label><input style={inp()} placeholder="Tamil Nadu" value={form.state} onChange={e => setForm(f=>({...f,state:e.target.value}))} /></div>
              <div><label style={lbl}>PIN</label><input style={inp()} placeholder="641001" value={form.pincode} onChange={e => setForm(f=>({...f,pincode:e.target.value}))} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div><label style={lbl}>Contact person</label><input style={inp()} placeholder="Rajan Kumar" value={form.contact_person} onChange={e => setForm(f=>({...f,contact_person:e.target.value}))} /></div>
              <div><label style={lbl}>Phone</label><input style={inp()} placeholder="9876543210" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom:'22px' }}><label style={lbl}>Email</label><input style={inp()} type="email" placeholder="purchase@company.in" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'11px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>{saving?'Saving...':editId?'Save changes':'Create customer'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding:'11px 20px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
