/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

const supabase = createClient()

type ParamField = { id?: string; field_name: string; field_key: string; field_type: string; unit: string; spec_min: string; spec_max: string; is_required: boolean; display_order: number; is_qc_field: boolean }
type ProcessType = { id: string; code: string; name: string; category: string; std_cycle_time_mins: number | null; requires_qc: boolean; qc_is_blocking: boolean; is_active: boolean }

const FIELD_TYPES = ['numeric', 'text', 'dropdown', 'boolean', 'date']
const CATEGORIES = ['machine', 'labour', 'vendor']

function toKey(name: string) { return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }

export default function ProcessTypesPage() {
  const [rows, setRows] = useState<ProcessType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [params, setParams] = useState<ParamField[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', category:'machine', std_cycle_time_mins:'', requires_qc:true, qc_is_blocking:true })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('process_types').select('*').order('name')
    setRows(data || [])
    setLoading(false)
  }

  async function loadParams(id: string) {
    const { data } = await supabase.from('process_parameter_schemas').select('*').eq('process_type_id', id).order('display_order')
    setParams(data || [])
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setSelectedId(null)
    setParams([])
    setForm({ code:'', name:'', category:'machine', std_cycle_time_mins:'', requires_qc:true, qc_is_blocking:true })
    setShowForm(true)
  }

  function openEdit(row: ProcessType) {
    setSelectedId(row.id)
    setForm({ code:row.code, name:row.name, category:row.category, std_cycle_time_mins:row.std_cycle_time_mins?.toString()||'', requires_qc:row.requires_qc, qc_is_blocking:row.qc_is_blocking })
    loadParams(row.id)
    setShowForm(true)
  }

  function addParam() {
    setParams(p => [...p, { field_name:'', field_key:'', field_type:'numeric', unit:'', spec_min:'', spec_max:'', is_required:true, display_order:p.length, is_qc_field:true }])
  }

  function updateParam(i: number, key: string, val: any) {
    setParams(p => p.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [key]: val }
      if (key === 'field_name') updated.field_key = toKey(val)
      return updated
    }))
  }

  function removeParam(i: number) { setParams(p => p.filter((_, idx) => idx !== i)) }

  async function save() {
    setSaving(true)
    const payload = { ...form, std_cycle_time_mins: form.std_cycle_time_mins ? parseInt(form.std_cycle_time_mins) : null }
    let processId = selectedId

    if (selectedId) {
      await (supabase.from('process_types') as any).update(payload).eq('id', selectedId)
    } else {
      const { data } = await (supabase.from('process_types') as any).insert(payload).select().single()
      processId = (data as any)?.id
    }

    if (processId) {
      // delete existing params and re-insert
      await (supabase.from('process_parameter_schemas') as any).delete().eq('process_type_id', processId)
      if (params.length > 0) {
        await (supabase.from('process_parameter_schemas') as any).insert(
          params.map((p, i) => ({
            process_type_id: processId,
            field_name: p.field_name,
            field_key: p.field_key || toKey(p.field_name),
            field_type: p.field_type,
            unit: p.unit || null,
            spec_min: p.spec_min ? parseFloat(p.spec_min) : null,
            spec_max: p.spec_max ? parseFloat(p.spec_max) : null,
            is_required: p.is_required,
            display_order: i,
            is_qc_field: p.is_qc_field,
          }))
        )
      }
    }

    setSaving(false)
    setShowForm(false)
    load()
  }

  const inp = (style = {}) => ({
    padding:'8px 11px', fontSize:'13px', color:'#111827', background:'#f9fafb',
    border:'1.5px solid #e5e7eb', borderRadius:'7px', outline:'none',
    boxSizing:'border-box' as const, width:'100%', ...style
  })

  const lbl = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }

  return (
    <div style={{ padding:'32px', maxWidth:'1000px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader title="Process types" subtitle="Define each manufacturing process and its measurement fields"
        actions={
          <button onClick={openNew} style={{ padding:'9px 18px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
            + New process type
          </button>
        }
      />

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#9ca3af', fontSize:'14px' }}>Loading...</div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                {['Code', 'Name', 'Category', 'Cycle time', 'QC', 'Status', ''].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No process types yet — create your first one</td></tr>
              )}
              {rows.map(row => (
                <tr key={row.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                  <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:'600', color:'#374151' }}>{row.code}</td>
                  <td style={{ padding:'12px 16px', fontSize:'14px', color:'#111827', fontWeight:'500' }}>{row.name}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600',
                      background: row.category==='machine'?'#eff6ff':row.category==='labour'?'#f0fdf4':'#fef3c7',
                      color: row.category==='machine'?'#1e40af':row.category==='labour'?'#065f46':'#92400e'
                    }}>{row.category}</span>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:'13px', color:'#6b7280' }}>{row.std_cycle_time_mins ? `${row.std_cycle_time_mins} min` : '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:'13px' }}>
                    {row.requires_qc ? <span style={{ color:'#059669', fontWeight:'600' }}>✓ {row.qc_is_blocking ? 'Blocking' : 'Advisory'}</span> : <span style={{ color:'#9ca3af' }}>No QC</span>}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600',
                      background: row.is_active?'#f0fdf4':'#f9fafb', color: row.is_active?'#065f46':'#6b7280'
                    }}>{row.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={() => openEdit(row)} style={{ padding:'5px 12px', fontSize:'12px', fontWeight:'500', color:'#1e40af', background:'#eff6ff', border:'none', borderRadius:'6px', cursor:'pointer' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'flex-end' }}>
          <div style={{ width:'600px', height:'100vh', background:'#fff', overflowY:'auto', padding:'28px', boxShadow:'-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'17px', fontWeight:'700', color:'#111827', margin:0 }}>
                {selectedId ? 'Edit process type' : 'New process type'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', color:'#9ca3af', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>

            {/* Basic fields */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              <div>
                <label style={lbl}>Code</label>
                <input style={inp()} placeholder="DISH-FORM" value={form.code} onChange={e => setForm(f => ({...f, code:e.target.value.toUpperCase()}))} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select style={inp()} value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={lbl}>Process name</label>
              <input style={inp()} placeholder="Dish End Forming" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={lbl}>Standard cycle time (minutes per unit)</label>
              <input style={inp({width:'50%'})} type="number" placeholder="45" value={form.std_cycle_time_mins} onChange={e => setForm(f => ({...f, std_cycle_time_mins:e.target.value}))} />
            </div>
            <div style={{ display:'flex', gap:'24px', marginBottom:'24px' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#374151', cursor:'pointer' }}>
                <input type="checkbox" checked={form.requires_qc} onChange={e => setForm(f => ({...f, requires_qc:e.target.checked}))} />
                Requires QC
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#374151', cursor:'pointer' }}>
                <input type="checkbox" checked={form.qc_is_blocking} onChange={e => setForm(f => ({...f, qc_is_blocking:e.target.checked}))} />
                QC is blocking (hard stop)
              </label>
            </div>

            {/* Parameter Schema Builder */}
            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:'20px', marginBottom:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#111827' }}>Parameter schema</div>
                  <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'2px' }}>Fields workers fill when running this process — checked at QC</div>
                </div>
                <button onClick={addParam} style={{ padding:'6px 14px', background:'#f0fdf4', color:'#065f46', border:'1px solid #bbf7d0', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                  + Add field
                </button>
              </div>

              {params.length === 0 && (
                <div style={{ padding:'20px', background:'#f9fafb', borderRadius:'8px', textAlign:'center', fontSize:'13px', color:'#9ca3af' }}>
                  No parameters yet. Example: Blank Dia (mm), Knuckle Radius (mm)
                </div>
              )}

              {params.map((p, i) => (
                <div key={i} style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px', marginBottom:'10px', border:'1px solid #f3f4f6' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                    <div>
                      <label style={lbl}>Field name</label>
                      <input style={inp()} placeholder="Blank Dia" value={p.field_name}
                        onChange={e => updateParam(i, 'field_name', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Type</label>
                      <select style={inp()} value={p.field_type} onChange={e => updateParam(i, 'field_type', e.target.value)}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Unit</label>
                      <input style={inp()} placeholder="mm" value={p.unit} onChange={e => updateParam(i, 'unit', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px', alignItems:'end' }}>
                    <div>
                      <label style={lbl}>Spec min</label>
                      <input style={inp()} type="number" placeholder="500" value={p.spec_min} onChange={e => updateParam(i, 'spec_min', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Spec max</label>
                      <input style={inp()} type="number" placeholder="2000" value={p.spec_max} onChange={e => updateParam(i, 'spec_max', e.target.value)} />
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#374151', cursor:'pointer' }}>
                        <input type="checkbox" checked={p.is_qc_field} onChange={e => updateParam(i, 'is_qc_field', e.target.checked)} />
                        Show at QC
                      </label>
                      <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#374151', cursor:'pointer' }}>
                        <input type="checkbox" checked={p.is_required} onChange={e => updateParam(i, 'is_required', e.target.checked)} />
                        Required
                      </label>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <button onClick={() => removeParam(i)} style={{ padding:'5px 10px', background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>Remove</button>
                    </div>
                  </div>
                  {p.field_key && <div style={{ marginTop:'6px', fontSize:'11px', color:'#9ca3af' }}>Key: <code>{p.field_key}</code></div>}
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'11px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>
                {saving ? 'Saving...' : selectedId ? 'Save changes' : 'Create process type'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding:'11px 20px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
