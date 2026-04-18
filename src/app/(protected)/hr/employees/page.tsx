/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function EmployeesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showWage, setShowWage] = useState(false)
  const [wageEmpId, setWageEmpId] = useState<string|null>(null)
  const [wageForm, setWageForm] = useState({ basic: '', da: '', hra: '', conveyance: '', special_allowance: '', effective_from: '' })

  const [form, setForm] = useState({
    full_name: '', father_name: '', date_of_birth: '', date_of_joining: '', employee_type: 'permanent',
    department_id: '', designation_id: '', phone: '', emergency_phone: '', address: '',
    aadhaar_number: '', pan_number: '', uan_number: '', esic_number: '',
    bank_name: '', bank_account: '', bank_ifsc: '', is_active: true,
  })

  async function load() { setLoading(true); const r = await fetch('/api/hr/employees'); if (r.ok) setRows(await r.json()); setLoading(false) }
  useEffect(() => {
    load()
    fetch('/api/masters?table=departments&order=name').then(r => r.json()).then(setDepartments)
    fetch('/api/masters?table=designations&order=name').then(r => r.json()).then(setDesignations)
  }, [])

  function openNew() { setEditId(null); setForm({ full_name:'',father_name:'',date_of_birth:'',date_of_joining:new Date().toISOString().split('T')[0],employee_type:'permanent',department_id:'',designation_id:'',phone:'',emergency_phone:'',address:'',aadhaar_number:'',pan_number:'',uan_number:'',esic_number:'',bank_name:'',bank_account:'',bank_ifsc:'',is_active:true }); setShowForm(true) }
  function openEdit(e: any) { setEditId(e.id); setForm({ full_name:e.full_name,father_name:e.father_name||'',date_of_birth:e.date_of_birth||'',date_of_joining:e.date_of_joining,employee_type:e.employee_type,department_id:e.department_id||'',designation_id:e.designation_id||'',phone:e.phone||'',emergency_phone:e.emergency_phone||'',address:e.address||'',aadhaar_number:e.aadhaar_number||'',pan_number:e.pan_number||'',uan_number:e.uan_number||'',esic_number:e.esic_number||'',bank_name:e.bank_name||'',bank_account:e.bank_account||'',bank_ifsc:e.bank_ifsc||'',is_active:e.is_active }); setShowForm(true) }

  async function save() {
    setSaving(true); setError('')
    try {
      const payload = { ...form, department_id: form.department_id||null, designation_id: form.designation_id||null, date_of_birth: form.date_of_birth||null, father_name: form.father_name||null, aadhaar_number: form.aadhaar_number||null, pan_number: form.pan_number||null, uan_number: form.uan_number||null, esic_number: form.esic_number||null, phone: form.phone||null, bank_name: form.bank_name||null, bank_account: form.bank_account||null, bank_ifsc: form.bank_ifsc||null }
      const r = editId
        ? await fetch(`/api/hr/employees/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/hr/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error(await r.text())
      setShowForm(false); load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function saveWage() {
    if (!wageEmpId) return
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/masters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'wage_structures', payload: { employee_id: wageEmpId, basic: parseFloat(wageForm.basic)||0, da: parseFloat(wageForm.da)||0, hra: parseFloat(wageForm.hra)||0, conveyance: parseFloat(wageForm.conveyance)||0, special_allowance: parseFloat(wageForm.special_allowance)||0, effective_from: wageForm.effective_from||new Date().toISOString().split('T')[0] } })
      })
      if (!r.ok) throw new Error(await r.text())
      setShowWage(false)
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const filtered = rows.filter(e => !search || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.employee_code?.toLowerCase().includes(search.toLowerCase()))
  const inp = (style: any = {}) => ({ padding: '8px 10px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '10px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
  const sec = { fontSize: '11px', fontWeight: '700' as const, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div><h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Employees</h1><p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{rows.filter(e => e.is_active).length} active employees</p></div>
        <button onClick={openNew} style={{ padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ New employee</button>
      </div>

      <input placeholder="Search by name or employee code..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inp(), width: '280px', marginBottom: '16px' }} />

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Code','Name','Type','Department','Designation','Phone','Status',''].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No employees yet</td></tr>}
            {filtered.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#1e40af', fontFamily: 'monospace' }}>{e.employee_code}</td>
                <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{e.full_name}</td>
                <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: e.employee_type === 'permanent' ? '#eff6ff' : '#f3f4f6', color: e.employee_type === 'permanent' ? '#1e40af' : '#6b7280' }}>{e.employee_type}</span></td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{e.departments?.name || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{e.designations?.name || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280' }}>{e.phone || '—'}</td>
                <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: e.is_active ? '#f0fdf4' : '#fef2f2', color: e.is_active ? '#065f46' : '#dc2626' }}>{e.is_active ? 'Active' : 'Inactive'}</span></td>
                <td style={{ padding: '12px 14px', display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEdit(e)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => { setWageEmpId(e.id); setWageForm({ basic:'',da:'',hra:'',conveyance:'',special_allowance:'',effective_from:new Date().toISOString().split('T')[0] }); setShowWage(true) }} style={{ padding: '4px 10px', background: '#f0fdf4', color: '#065f46', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Wage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '600px', height: '100vh', background: '#fff', overflowY: 'auto', padding: '28px', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>{editId ? 'Edit employee' : 'New employee'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>
            {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

            <div style={sec}>Personal details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>Full name *</label><input style={inp()} placeholder="Rajan Kumar" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
              <div><label style={lbl}>Employee type</label><select style={inp()} value={form.employee_type} onChange={e => setForm(f => ({ ...f, employee_type: e.target.value }))}><option value="permanent">Permanent</option><option value="contract">Contract</option><option value="trainee">Trainee</option><option value="apprentice">Apprentice</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>Date of joining *</label><input style={inp()} type="date" value={form.date_of_joining} onChange={e => setForm(f => ({ ...f, date_of_joining: e.target.value }))} /></div>
              <div><label style={lbl}>Date of birth</label><input style={inp()} type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} /></div>
              <div><label style={lbl}>Father name</label><input style={inp()} value={form.father_name} onChange={e => setForm(f => ({ ...f, father_name: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={lbl}>Department</label><select style={inp()} value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}><option value="">— Select —</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label style={lbl}>Designation</label><select style={inp()} value={form.designation_id} onChange={e => setForm(f => ({ ...f, designation_id: e.target.value }))}><option value="">— Select —</option>{designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            </div>

            <div style={sec}>Contact</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>Phone</label><input style={inp()} placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><label style={lbl}>Emergency contact</label><input style={inp()} placeholder="9876543211" value={form.emergency_phone} onChange={e => setForm(f => ({ ...f, emergency_phone: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: '16px' }}><label style={lbl}>Address</label><textarea style={{ ...inp(), height: '60px', resize: 'none' as const }} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>

            <div style={sec}>Statutory IDs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={lbl}>Aadhaar</label><input style={inp()} placeholder="XXXX XXXX XXXX" value={form.aadhaar_number} onChange={e => setForm(f => ({ ...f, aadhaar_number: e.target.value }))} /></div>
              <div><label style={lbl}>PAN</label><input style={inp()} placeholder="AAAAA0000A" value={form.pan_number} onChange={e => setForm(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))} /></div>
              <div><label style={lbl}>UAN (PF)</label><input style={inp()} placeholder="100XXXXXXXXX" value={form.uan_number} onChange={e => setForm(f => ({ ...f, uan_number: e.target.value }))} /></div>
              <div><label style={lbl}>ESIC number</label><input style={inp()} value={form.esic_number} onChange={e => setForm(f => ({ ...f, esic_number: e.target.value }))} /></div>
            </div>

            <div style={sec}>Bank details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div><label style={lbl}>Bank name</label><input style={inp()} placeholder="SBI" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
              <div><label style={lbl}>Account number</label><input style={inp()} value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} /></div>
              <div><label style={lbl}>IFSC</label><input style={inp()} placeholder="SBIN0001234" value={form.bank_ifsc} onChange={e => setForm(f => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))} /></div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={save} disabled={saving || !form.full_name || !form.date_of_joining} style={{ flex: 1, padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Saving...' : editId ? 'Save changes' : 'Create employee'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Wage structure modal */}
      {showWage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '440px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Set wage structure</h3>
              <button onClick={() => setShowWage(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>Basic (₹/month)</label><input style={inp()} type="number" value={wageForm.basic} onChange={e => setWageForm(f => ({ ...f, basic: e.target.value }))} /></div>
              <div><label style={lbl}>DA</label><input style={inp()} type="number" value={wageForm.da} onChange={e => setWageForm(f => ({ ...f, da: e.target.value }))} /></div>
              <div><label style={lbl}>HRA</label><input style={inp()} type="number" value={wageForm.hra} onChange={e => setWageForm(f => ({ ...f, hra: e.target.value }))} /></div>
              <div><label style={lbl}>Conveyance</label><input style={inp()} type="number" value={wageForm.conveyance} onChange={e => setWageForm(f => ({ ...f, conveyance: e.target.value }))} /></div>
              <div><label style={lbl}>Special allowance</label><input style={inp()} type="number" value={wageForm.special_allowance} onChange={e => setWageForm(f => ({ ...f, special_allowance: e.target.value }))} /></div>
              <div><label style={lbl}>Effective from</label><input style={inp()} type="date" value={wageForm.effective_from} onChange={e => setWageForm(f => ({ ...f, effective_from: e.target.value }))} /></div>
            </div>
            {wageForm.basic && (
              <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px' }}>
                <div style={{ color: '#065f46', fontWeight: '600' }}>Gross: ₹{[wageForm.basic,wageForm.da,wageForm.hra,wageForm.conveyance,wageForm.special_allowance].reduce((s,v) => s + (parseFloat(v)||0), 0).toLocaleString('en-IN')}/month</div>
                <div style={{ color: '#6b7280', marginTop: '2px' }}>PF: ₹{Math.round(Math.min((parseFloat(wageForm.basic)||0)+(parseFloat(wageForm.da)||0), 15000)*0.12).toLocaleString('en-IN')}/month</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={saveWage} disabled={saving} style={{ flex: 1, padding: '10px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save wage structure'}</button>
              <button onClick={() => setShowWage(false)} style={{ padding: '10px 18px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
