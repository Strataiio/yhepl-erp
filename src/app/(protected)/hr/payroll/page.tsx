/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function PayrollPage() {
  const now = new Date()
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [lineItems, setLineItems] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  async function load() { setLoading(true); const r = await fetch('/api/hr/payroll'); if(r.ok) setRuns(await r.json()); setLoading(false) }
  useEffect(() => { load() }, [])

  async function selectRun(run: any) {
    setSelectedRun(run)
    const r = await fetch(`/api/hr/payroll/${run.id}`)
    if(r.ok) setLineItems(await r.json())
  }

  async function processPayroll() {
    setProcessing(true); setError('')
    try {
      const r = await fetch('/api/hr/payroll',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({month,year}) })
      if(!r.ok) throw new Error(await r.text())
      const run = await r.json()
      await load()
      selectRun(run)
    } catch(e){ setError(String(e)) }
    setProcessing(false)
  }

  async function approvePayroll() {
    if(!selectedRun) return
    setApproving(true); setError('')
    try {
      const r = await fetch(`/api/hr/payroll/${selectedRun.id}`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'approved'}) })
      if(!r.ok) throw new Error(await r.text())
      await load(); setSelectedRun((s:any)=>({...s,status:'approved'}))
    } catch(e){ setError(String(e)) }
    setApproving(false)
  }

  const fmt = (n: number) => n ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—'
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const STATUS_CFG: Record<string,any> = {
    computed: { bg:'#fffbeb', color:'#92400e', label:'Computed' },
    approved: { bg:'#f0fdf4', color:'#065f46', label:'Approved' },
    paid:     { bg:'#eff6ff', color:'#1e40af', label:'Paid' },
  }

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui,sans-serif',overflow:'hidden'}}>
      {/* Left — payroll runs list */}
      <div style={{width:'320px',borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'20px',borderBottom:'1px solid #e5e7eb',background:'#f8fafc'}}>
          <h1 style={{fontSize:'16px',fontWeight:'700',color:'#0f172a',margin:'0 0 14px'}}>Payroll</h1>
          <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
            <select value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{flex:1,padding:'7px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',outline:'none'}}>
              {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{flex:1,padding:'7px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',outline:'none'}}>
              {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={processPayroll} disabled={processing}
            style={{width:'100%',padding:'9px',background:'#1e40af',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',opacity:processing?0.7:1}}>
            {processing?'Computing...':'⚙ Compute payroll'}
          </button>
          {error&&<div style={{background:'#fef2f2',borderRadius:'6px',padding:'8px',marginTop:'8px',fontSize:'11px',color:'#dc2626'}}>{error}</div>}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'10px'}}>
          {loading&&<div style={{padding:'24px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>Loading...</div>}
          {runs.map(run=>{
            const cfg = STATUS_CFG[run.status]||STATUS_CFG.computed
            return (
              <div key={run.id} onClick={()=>selectRun(run)}
                style={{background:selectedRun?.id===run.id?'#eff6ff':'#fff',border:`1px solid ${selectedRun?.id===run.id?'#bfdbfe':'#e5e7eb'}`,borderRadius:'10px',padding:'12px',marginBottom:'8px',cursor:'pointer',transition:'all 0.12s'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}>
                  <span style={{fontSize:'13px',fontWeight:'700',color:'#0f172a'}}>{MONTHS[(run.month||1)-1]} {run.year}</span>
                  <span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:'700',background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                </div>
                <div style={{fontSize:'14px',fontWeight:'700',color:'#1e40af'}}>{fmt(run.total_net_payable)}</div>
                <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px'}}>Gross: {fmt(run.total_gross)}</div>
              </div>
            )
          })}
          {!loading&&runs.length===0&&<div style={{padding:'24px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>No payroll runs yet. Select a month and compute.</div>}
        </div>
      </div>

      {/* Right — payroll detail */}
      <div style={{flex:1,overflowY:'auto',padding:'28px'}}>
        {!selectedRun?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',color:'#9ca3af'}}>
            <div style={{fontSize:'40px',opacity:0.3,marginBottom:'10px'}}>💰</div>
            <div style={{fontSize:'14px'}}>Select a payroll run to view details</div>
          </div>
        ):(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
              <div>
                <h2 style={{fontSize:'20px',fontWeight:'700',color:'#0f172a',margin:'0 0 4px'}}>{MONTHS[(selectedRun.month||1)-1]} {selectedRun.year} — Payroll</h2>
                <div style={{fontSize:'13px',color:'#6b7280'}}>{lineItems.length} employees · Status: {STATUS_CFG[selectedRun.status]?.label}</div>
              </div>
              {selectedRun.status==='computed'&&(
                <button onClick={approvePayroll} disabled={approving}
                  style={{padding:'9px 20px',background:'#059669',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>
                  {approving?'Approving...':'✓ Approve payroll'}
                </button>
              )}
            </div>

            {/* Summary KPIs */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'20px'}}>
              {[
                {label:'Gross payable',val:selectedRun.total_gross,color:'#1e40af'},
                {label:'PF (employee)',val:selectedRun.total_pf_employee,color:'#374151'},
                {label:'ESIC (employee)',val:selectedRun.total_esic_employee,color:'#374151'},
                {label:'PF (employer)',val:selectedRun.total_pf_employer,color:'#6b7280'},
                {label:'Net payable',val:selectedRun.total_net_payable,color:'#059669'},
              ].map(k=>(
                <div key={k.label} style={{background:'#f8fafc',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontSize:'10px',color:'#94a3b8',marginBottom:'3px',textTransform:'uppercase' as const,letterSpacing:'0.04em',fontWeight:'600'}}>{k.label}</div>
                  <div style={{fontSize:'15px',fontWeight:'700',color:k.color}}>{fmt(k.val)}</div>
                </div>
              ))}
            </div>

            {/* Line items table */}
            <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                <thead><tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
                  {['Employee','Dept','Days','Basic','DA+HRA','OT','Gross','PF','ESIC','Net Pay'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'right',fontSize:'10px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase' as const,letterSpacing:'0.04em',whiteSpace:'nowrap' as const}}>
                      {h==='Employee'||h==='Dept'?<span style={{float:'left'}}>{h}</span>:h}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {lineItems.map((li,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{fontWeight:'600',color:'#111827'}}>{li.employees?.full_name}</div>
                        <div style={{fontSize:'10px',color:'#9ca3af'}}>{li.employees?.employee_code}</div>
                      </td>
                      <td style={{padding:'10px 12px',color:'#6b7280'}}>{li.employees?.departments?.name||'—'}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontWeight:'600',color:'#374151'}}>{li.present_days}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:'#374151'}}>{fmt(li.basic)}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:'#374151'}}>{fmt((li.da||0)+(li.hra||0)+(li.conveyance||0)+(li.special_allowance||0))}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:(li.ot_amount||0)>0?'#1e40af':'#9ca3af'}}>{li.ot_amount>0?fmt(li.ot_amount):'—'}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontWeight:'700',color:'#0f172a'}}>{fmt(li.gross_earnings)}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:'#6b7280'}}>{fmt(li.pf_employee)}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:'#6b7280'}}>{fmt(li.esic_employee)}</td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontWeight:'700',color:'#059669'}}>{fmt(li.net_payable)}</td>
                    </tr>
                  ))}
                  {lineItems.length===0&&<tr><td colSpan={10} style={{padding:'32px',textAlign:'center',color:'#9ca3af'}}>Loading payslip data...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
