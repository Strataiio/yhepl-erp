/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

const STATUS_CFG: Record<string,any> = {
  pending:  { bg:'#fffbeb', color:'#92400e', label:'Pending' },
  approved: { bg:'#f0fdf4', color:'#065f46', label:'Approved' },
  rejected: { bg:'#fef2f2', color:'#dc2626', label:'Rejected' },
  cancelled:{ bg:'#f3f4f6', color:'#6b7280', label:'Cancelled' },
}

export default function LeavePage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState({ employee_id:'', leave_type:'cl', from_date:'', to_date:'', reason:'' })

  async function load() { setLoading(true); const r = await fetch('/api/hr/leave'); if(r.ok) setRows(await r.json()); setLoading(false) }
  useEffect(() => {
    load()
    fetch('/api/hr/employees').then(r=>r.json()).then(d=>setEmployees(Array.isArray(d)?d.filter((e:any)=>e.is_active):[]))
  }, [])

  async function apply() {
    setSaving(true); setError('')
    const days = form.from_date && form.to_date ? Math.ceil((new Date(form.to_date).getTime()-new Date(form.from_date).getTime())/86400000)+1 : 0
    try {
      const r = await fetch('/api/hr/leave',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form,days,status:'pending'}) })
      if(!r.ok) throw new Error(await r.text())
      setShowForm(false); load()
    } catch(e){ setError(String(e)) }
    setSaving(false)
  }

  async function approve(id:string, status:'approved'|'rejected') {
    await fetch('/api/hr/leave',{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,status}) })
    load()
  }

  const filtered = rows.filter(r => statusFilter==='all' || r.status===statusFilter)
  const counts = rows.reduce((a:any,r)=>{a[r.status]=(a[r.status]||0)+1;return a},{})
  const inp = (style:any={}) => ({padding:'8px 10px',fontSize:'13px',color:'#111827',background:'#f9fafb',border:'1.5px solid #e5e7eb',borderRadius:'7px',outline:'none',width:'100%',boxSizing:'border-box' as const,...style})
  const lbl = {fontSize:'10px',fontWeight:'600' as const,color:'#6b7280',display:'block' as const,marginBottom:'4px',textTransform:'uppercase' as const,letterSpacing:'0.04em'}

  return (
    <div style={{padding:'32px',maxWidth:'1000px',fontFamily:'system-ui,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div><h1 style={{fontSize:'20px',fontWeight:'700',color:'#0f172a',margin:'0 0 4px'}}>Leave management</h1><p style={{fontSize:'13px',color:'#64748b',margin:0}}>Apply, approve, and track leave applications</p></div>
        <button onClick={()=>{setShowForm(true);setError('')}} style={{padding:'9px 18px',background:'#1e40af',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>+ Apply leave</button>
      </div>

      <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
        {[['all','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(([k,l])=>(
          <button key={k} onClick={()=>setStatusFilter(k)} style={{padding:'5px 14px',borderRadius:'20px',border:'none',fontSize:'12px',fontWeight:'600',cursor:'pointer',background:statusFilter===k?'#0f172a':'#f1f5f9',color:statusFilter===k?'#fff':'#475569'}}>
            {l} {k!=='all'&&counts[k]?`(${counts[k]})`:k==='all'?`(${rows.length})`:''}
          </button>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
            {['Employee','Department','Leave type','From','To','Days','Reason','Status',''].map(h=>(
              <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase' as const,letterSpacing:'0.05em'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{padding:'40px',textAlign:'center',color:'#9ca3af'}}>Loading...</td></tr>}
            {!loading && filtered.length===0 && <tr><td colSpan={9} style={{padding:'40px',textAlign:'center',color:'#9ca3af'}}>No leave applications</td></tr>}
            {filtered.map(r=>{
              const cfg = STATUS_CFG[r.status]||STATUS_CFG.pending
              return (
                <tr key={r.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{padding:'11px 14px',fontSize:'13px',fontWeight:'500',color:'#111827'}}>{r.employees?.full_name}</td>
                  <td style={{padding:'11px 14px',fontSize:'12px',color:'#6b7280'}}>{r.employees?.departments?.name||'—'}</td>
                  <td style={{padding:'11px 14px'}}><span style={{padding:'2px 8px',background:'#eff6ff',color:'#1e40af',borderRadius:'10px',fontSize:'11px',fontWeight:'600'}}>{r.leave_type?.toUpperCase()}</span></td>
                  <td style={{padding:'11px 14px',fontSize:'13px',color:'#374151'}}>{r.from_date?new Date(r.from_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                  <td style={{padding:'11px 14px',fontSize:'13px',color:'#374151'}}>{r.to_date?new Date(r.to_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                  <td style={{padding:'11px 14px',fontSize:'13px',fontWeight:'700',color:'#0f172a'}}>{r.days}</td>
                  <td style={{padding:'11px 14px',fontSize:'12px',color:'#6b7280',maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{r.reason||'—'}</td>
                  <td style={{padding:'11px 14px'}}><span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'600',background:cfg.bg,color:cfg.color}}>{cfg.label}</span></td>
                  <td style={{padding:'11px 14px'}}>
                    {r.status==='pending'&&(
                      <div style={{display:'flex',gap:'4px'}}>
                        <button onClick={()=>approve(r.id,'approved')} style={{padding:'3px 8px',background:'#f0fdf4',color:'#065f46',border:'none',borderRadius:'5px',fontSize:'11px',fontWeight:'600',cursor:'pointer'}}>Approve</button>
                        <button onClick={()=>approve(r.id,'rejected')} style={{padding:'3px 8px',background:'#fef2f2',color:'#dc2626',border:'none',borderRadius:'5px',fontSize:'11px',fontWeight:'600',cursor:'pointer'}}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:'440px',background:'#fff',borderRadius:'16px',padding:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
              <h3 style={{fontSize:'15px',fontWeight:'700',color:'#111827',margin:0}}>Apply leave</h3>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',fontSize:'20px',color:'#9ca3af',cursor:'pointer'}}>×</button>
            </div>
            {error&&<div style={{background:'#fef2f2',borderRadius:'8px',padding:'10px',marginBottom:'12px',fontSize:'12px',color:'#dc2626'}}>{error}</div>}
            <div style={{marginBottom:'12px'}}><label style={lbl}>Employee *</label><select style={inp()} value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}><option value="">— Select —</option>{employees.map(e=><option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}</select></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
              <div><label style={lbl}>Leave type</label><select style={inp()} value={form.leave_type} onChange={e=>setForm(f=>({...f,leave_type:e.target.value}))}><option value="cl">CL — Casual</option><option value="sl">SL — Sick</option><option value="el">EL — Earned</option><option value="lop">LOP — Loss of Pay</option><option value="festival">Festival</option></select></div>
              <div />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
              <div><label style={lbl}>From date</label><input style={inp()} type="date" value={form.from_date} onChange={e=>setForm(f=>({...f,from_date:e.target.value}))}/></div>
              <div><label style={lbl}>To date</label><input style={inp()} type="date" value={form.to_date} onChange={e=>setForm(f=>({...f,to_date:e.target.value}))}/></div>
            </div>
            {form.from_date&&form.to_date&&<div style={{fontSize:'12px',color:'#1e40af',fontWeight:'600',marginBottom:'12px'}}>Days: {Math.ceil((new Date(form.to_date).getTime()-new Date(form.from_date).getTime())/86400000)+1}</div>}
            <div style={{marginBottom:'18px'}}><label style={lbl}>Reason</label><textarea style={{...inp(),height:'60px',resize:'none' as const}} value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/></div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={apply} disabled={saving||!form.employee_id||!form.from_date||!form.to_date} style={{flex:1,padding:'10px',background:'#1e40af',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>{saving?'Applying...':'Apply leave'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'10px 18px',background:'#f1f5f9',color:'#374151',border:'none',borderRadius:'8px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
