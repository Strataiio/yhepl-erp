/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'

async function loadData(table:string, select='*', order='name'){
  const r = await fetch(`/api/masters?table=${table}&select=${encodeURIComponent(select)}&order=${order}`)
  if(!r.ok){ const t=await r.text(); throw new Error(t) }
  return r.json()
}
async function saveData(table:string, payload:any, id?:string){
  const r = await fetch('/api/masters',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({table,payload,id})})
  if(!r.ok){ const t=await r.text(); throw new Error(t) }
  return r.json()
}

export default function Page() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(){
    setLoading(true); setError('')
    try { setRows(await loadData('process_routes')) } catch(e){ setError(String(e)) }
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const cols = ['code|name|route_type|version|is_current|is_active'.split('|')]

  return (
    <div style={{padding:'32px',maxWidth:'1000px',fontFamily:'system-ui,sans-serif'}}>
      <PageHeader title="Process routes" subtitle="Route templates — Fixed, Parallel, Conditional" />
      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px',fontSize:'13px',color:'#dc2626'}}>{error}</div>}
      <div style={{background:'#fff8f0',border:'1px solid #fed7aa',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',fontSize:'13px',color:'#9a3412'}}>
        Full create/edit form coming next session. Showing live data from database.
      </div>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
            {cols[0].map((h:string)=><th key={h} style={{padding:'11px 16px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h.replace(/_/g,' ')}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={cols[0].length} style={{padding:'48px',textAlign:'center',color:'#9ca3af'}}>Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan={cols[0].length} style={{padding:'48px',textAlign:'center',color:'#9ca3af',fontSize:'14px'}}>No records yet</td></tr>}
            {rows.map((r,i)=>(
              <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                {cols[0].map((c:string)=>(
                  <td key={c} style={{padding:'12px 16px',fontSize:'13px',color:'#374151'}}>
                    {typeof r[c]==='boolean'?(r[c]?<span style={{color:'#059669',fontWeight:'600'}}>Yes</span>:<span style={{color:'#9ca3af'}}>No</span>):(r[c]?.toString().substring(0,60)||'—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
