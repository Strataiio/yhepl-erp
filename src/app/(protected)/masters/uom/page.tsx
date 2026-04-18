/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
const supabase = createClient()
export default function Page() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('uom_master').select('*').order('created_at', { ascending:false }).limit(100).then(({ data }) => { setRows(data||[]); setLoading(false) })
  }, [])
  const cols = rows[0] ? Object.keys(rows[0]).filter(k => !['id','created_at','updated_at','created_by'].includes(k)) : []
  return (
    <div style={{ padding:'32px', maxWidth:'1000px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader title="Units of measure" subtitle="kg, nos, mm, sqm — referenced across all inventory" />
      <div style={{ background:'#fff8f0', border:'1px solid #fed7aa', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:'#9a3412' }}>
        Full form coming next build session. Data is live from Supabase — {rows.length} records.
      </div>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
            {cols.slice(0,6).map(c => <th key={c} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{c.replace(/_/g,' ')}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#9ca3af' }}>Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No records yet</td></tr>}
            {rows.map((r,i) => (
              <tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}>
                {cols.slice(0,6).map(c => <td key={c} style={{ padding:'12px 16px', fontSize:'13px', color:'#374151' }}>{typeof r[c] === 'boolean' ? (r[c]?'Yes':'No') : (r[c]?.toString().substring(0,40)||'—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
