/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

const WELD_PROCESSES = ['SMAW', 'GMAW', 'GTAW', 'SAW', 'FCAW', 'PWHT']
const NDT_TYPES = ['RT', 'UT', 'MT', 'PT', 'VT']
const JOINT_TYPES = ['BW', 'FW', 'PW', 'SW']

const NDT_RESULT_CFG: Record<string, any> = {
  accept:  { bg: '#f0fdf4', color: '#065f46', label: 'Accept' },
  reject:  { bg: '#fef2f2', color: '#dc2626', label: 'Reject' },
  repair:  { bg: '#fffbeb', color: '#92400e', label: 'Repair' },
  pending: { bg: '#f8fafc', color: '#6b7280', label: 'Pending' },
}

export default function WeldPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [wpsList, setWpsList] = useState<any[]>([])
  const [joints, setJoints] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'joints' | 'wps'>('joints')
  const [showJointForm, setShowJointForm] = useState(false)
  const [showWPSForm, setShowWPSForm] = useState(false)
  const [selectedJoint, setSelectedJoint] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [jointForm, setJointForm] = useState({
    joint_number: '', joint_type: 'BW', drawing_ref: '', location_description: '',
    wps_id: '', welder_id: '', base_material_1: '', base_material_2: '',
    thickness_mm: '', diameter_mm: '', weld_date: '', ndt_required: false,
    ndt_type: '', ndt_result: 'pending', ndt_report_ref: '', ndt_date: '', remarks: ''
  })
  const [wpsForm, setWpsForm] = useState({
    wps_number: '', revision: '0', process: 'SMAW', base_material_1: '', base_material_2: '',
    filler_material: '', min_thickness_mm: '', max_thickness_mm: '', min_diameter_mm: '',
    preheat_temp_c: '', pwht_required: false, pwht_temp_c: '', pwht_duration_hrs: '',
    applicable_code: 'ASME_VIII_Div1', is_active: true
  })

  async function loadJoints() {
    setLoading(true)
    const r = await fetch(`/api/quality/weld${selectedProject ? `?project_id=${selectedProject}` : ''}`)
    if (r.ok) setJoints(await r.json())
    setLoading(false)
  }

  async function loadWPS() {
    const r = await fetch('/api/quality/wps')
    if (r.ok) setWpsList(await r.json())
  }

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
    fetch('/api/hr/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d.filter((e: any) => e.is_active) : []))
    loadWPS()
  }, [])

  useEffect(() => { loadJoints() }, [selectedProject])

  async function saveJoint() {
    setSaving(true); setError('')
    try {
      const payload: any = { ...jointForm, project_id: selectedProject || null, thickness_mm: jointForm.thickness_mm ? parseFloat(jointForm.thickness_mm) : null, diameter_mm: jointForm.diameter_mm ? parseFloat(jointForm.diameter_mm) : null, wps_id: jointForm.wps_id || null, welder_id: jointForm.welder_id || null, weld_date: jointForm.weld_date || null, ndt_date: jointForm.ndt_date || null, ndt_type: jointForm.ndt_type || null, ndt_report_ref: jointForm.ndt_report_ref || null, remarks: jointForm.remarks || null }
      const r = await fetch('/api/quality/weld', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error(await r.text())
      setShowJointForm(false); loadJoints()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function updateJointNDT(id: string, updates: any) {
    await fetch('/api/quality/weld', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
    loadJoints()
  }

  async function saveWPS() {
    setSaving(true); setError('')
    try {
      const payload = {
        wps_number: wpsForm.wps_number, revision: wpsForm.revision,
        title: `${wpsForm.process} ${wpsForm.base_material_1}`,
        base_metal_p_number: wpsForm.base_material_1 || null,
        filler_aws_class: wpsForm.filler_material || null,
        thickness_min: wpsForm.min_thickness_mm ? parseFloat(wpsForm.min_thickness_mm) : null,
        thickness_max: wpsForm.max_thickness_mm ? parseFloat(wpsForm.max_thickness_mm) : null,
        preheat_min_degc: wpsForm.preheat_temp_c ? parseFloat(wpsForm.preheat_temp_c) : null,
        pwht_required: wpsForm.pwht_required,
        pwht_temp_degc: wpsForm.pwht_temp_c ? parseFloat(wpsForm.pwht_temp_c) : null,
        pwht_hold_hrs: wpsForm.pwht_duration_hrs ? parseFloat(wpsForm.pwht_duration_hrs) : null,
        applicable_code: wpsForm.applicable_code, is_active: wpsForm.is_active
      }
      const r = await fetch('/api/quality/wps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error(await r.text())
      setShowWPSForm(false); loadWPS()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const inp = (style: any = {}) => ({ padding: '8px 10px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '10px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
  const sec = { fontSize: '11px', fontWeight: '700' as const, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f3f4f6' }

  const stats = {
    total: joints.length,
    accepted: joints.filter(j => j.ndt_result === 'accept').length,
    rejected: joints.filter(j => j.ndt_result === 'reject').length,
    pending_ndt: joints.filter(j => j.ndt_required && j.ndt_result === 'pending').length,
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Weld management</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>WPS library, joint register, welder qualification, NDT results</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setShowWPSForm(true); setError('') }} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ WPS</button>
          <button onClick={() => { setShowJointForm(true); setError('') }} style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Joint</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total joints', value: stats.total, color: '#374151', bg: '#f8fafc' },
          { label: 'NDT accepted', value: stats.accepted, color: '#059669', bg: '#f0fdf4' },
          { label: 'NDT rejected', value: stats.rejected, color: '#dc2626', bg: '#fef2f2' },
          { label: 'NDT pending', value: stats.pending_ndt, color: '#7c3aed', bg: '#faf5ff' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: '600' }}>{k.label}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Project filter + tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[['joints', `Joint register (${joints.length})`], ['wps', `WPS library (${wpsList.length})`]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t as any)} style={{ padding: '8px 16px', border: 'none', background: tab === t ? '#0f172a' : '#f1f5f9', color: tab === t ? '#fff' : '#475569', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }}>
          <option value="">All projects</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}
        </select>
      </div>

      {/* JOINT REGISTER */}
      {tab === 'joints' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Joint no.', 'Type', 'Location', 'WPS', 'Welder', 'Date', 'Thickness', 'NDT type', 'NDT result', ''].map(h => (
                <th key={h} style={{ padding: '10px 13px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
              {!loading && joints.length === 0 && <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No joints logged yet</td></tr>}
              {joints.map(j => {
                const ndtCfg = NDT_RESULT_CFG[j.ndt_result || 'pending'] || NDT_RESULT_CFG.pending
                return (
                  <tr key={j.id} onClick={() => setSelectedJoint(selectedJoint?.id === j.id ? null : j)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedJoint?.id === j.id ? '#f0f9ff' : 'transparent', transition: 'background 0.1s' }}>
                    <td style={{ padding: '10px 13px', fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>{j.joint_number}</td>
                    <td style={{ padding: '10px 13px' }}><span style={{ padding: '2px 7px', background: '#f1f5f9', color: '#374151', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{j.joint_type}</span></td>
                    <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{j.location_description || '—'}</td>
                    <td style={{ padding: '10px 13px', fontSize: '12px', color: '#7c3aed', fontWeight: '600' }}>{j.wps_library?.wps_number || '—'}</td>
                    <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151' }}>{j.welders?.full_name || '—'}</td>
                    <td style={{ padding: '10px 13px', fontSize: '12px', color: '#6b7280' }}>{j.weld_date ? new Date(j.weld_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                    <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151' }}>{j.thickness_mm ? `${j.thickness_mm}mm` : '—'}</td>
                    <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151' }}>{j.ndt_required ? (j.ndt_type || 'TBD') : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={{ padding: '10px 13px' }}>
                      {j.ndt_required
                        ? <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: ndtCfg.bg, color: ndtCfg.color }}>{ndtCfg.label}</span>
                        : <span style={{ color: '#d1d5db', fontSize: '11px' }}>N/A</span>}
                    </td>
                    <td style={{ padding: '10px 13px' }}>
                      {j.ndt_required && j.ndt_result === 'pending' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={e => { e.stopPropagation(); updateJointNDT(j.id, { ndt_result: 'accept', ndt_date: new Date().toISOString().split('T')[0] }) }} style={{ padding: '3px 8px', background: '#f0fdf4', color: '#065f46', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Accept</button>
                          <button onClick={e => { e.stopPropagation(); updateJointNDT(j.id, { ndt_result: 'reject' }) }} style={{ padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* WPS LIBRARY */}
      {tab === 'wps' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['WPS number', 'Rev', 'Process', 'Base material', 'Filler', 'Thickness range', 'Code', 'PWHT', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 13px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {wpsList.length === 0 && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No WPS records yet</td></tr>}
              {wpsList.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 13px', fontSize: '13px', fontWeight: '700', color: '#7c3aed' }}>{w.wps_number}</td>
                  <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151' }}>Rev {w.revision}</td>
                  <td style={{ padding: '10px 13px' }}><span style={{ padding: '2px 8px', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>{w.process}</span></td>
                  <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151' }}>{w.title || w.base_metal_p_number || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151' }}>{w.filler_aws_class || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: '12px', color: '#374151' }}>{w.thickness_min && w.thickness_max ? `${w.thickness_min}–${w.thickness_max}mm` : '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: '11px', color: '#6b7280' }}>{w.applicable_code?.replace(/_/g, ' ') || '—'}</td>
                  <td style={{ padding: '10px 13px' }}>{w.pwht_required ? <span style={{ padding: '2px 7px', background: '#fffbeb', color: '#92400e', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>PWHT {w.pwht_temp_degc}°C</span> : <span style={{ color: '#d1d5db', fontSize: '11px' }}>No</span>}</td>
                  <td style={{ padding: '10px 13px' }}><span style={{ padding: '2px 7px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: w.is_active ? '#f0fdf4' : '#f3f4f6', color: w.is_active ? '#065f46' : '#6b7280' }}>{w.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JOINT FORM */}
      {showJointForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '580px', height: '100vh', background: '#fff', overflowY: 'auto', padding: '28px', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Log weld joint</h2>
              <button onClick={() => setShowJointForm(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>
            {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

            <div style={sec}>Joint identification</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div><label style={lbl}>Joint number *</label><input style={inp()} placeholder="J-001" value={jointForm.joint_number} onChange={e => setJointForm(f => ({ ...f, joint_number: e.target.value }))} /></div>
              <div><label style={lbl}>Joint type</label><select style={inp()} value={jointForm.joint_type} onChange={e => setJointForm(f => ({ ...f, joint_type: e.target.value }))}>{JOINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>Drawing ref</label><input style={inp()} placeholder="DRW-001" value={jointForm.drawing_ref} onChange={e => setJointForm(f => ({ ...f, drawing_ref: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: '14px' }}><label style={lbl}>Location / description</label><input style={inp()} placeholder="Shell nozzle N1, position 3G" value={jointForm.location_description} onChange={e => setJointForm(f => ({ ...f, location_description: e.target.value }))} /></div>

            <div style={sec}>Welding details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div><label style={lbl}>WPS</label><select style={inp()} value={jointForm.wps_id} onChange={e => setJointForm(f => ({ ...f, wps_id: e.target.value }))}><option value="">— Select WPS —</option>{wpsList.map(w => <option key={w.id} value={w.id}>{w.wps_number} ({w.process})</option>)}</select></div>
              <div><label style={lbl}>Welder</label><select style={inp()} value={jointForm.welder_id} onChange={e => setJointForm(f => ({ ...f, welder_id: e.target.value }))}><option value="">— Select welder —</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}</select></div>
              <div><label style={lbl}>Weld date</label><input style={inp()} type="date" value={jointForm.weld_date} onChange={e => setJointForm(f => ({ ...f, weld_date: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={lbl}>Base material 1</label><input style={inp()} placeholder="SA-516 Gr.70" value={jointForm.base_material_1} onChange={e => setJointForm(f => ({ ...f, base_material_1: e.target.value }))} /></div>
              <div><label style={lbl}>Base material 2</label><input style={inp()} placeholder="Same" value={jointForm.base_material_2} onChange={e => setJointForm(f => ({ ...f, base_material_2: e.target.value }))} /></div>
              <div><label style={lbl}>Thickness (mm)</label><input style={inp()} type="number" value={jointForm.thickness_mm} onChange={e => setJointForm(f => ({ ...f, thickness_mm: e.target.value }))} /></div>
              <div><label style={lbl}>Dia. (mm)</label><input style={inp()} type="number" value={jointForm.diameter_mm} onChange={e => setJointForm(f => ({ ...f, diameter_mm: e.target.value }))} /></div>
            </div>

            <div style={sec}>NDT</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              <input type="checkbox" checked={jointForm.ndt_required} onChange={e => setJointForm(f => ({ ...f, ndt_required: e.target.checked }))} />
              NDT required for this joint
            </label>
            {jointForm.ndt_required && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px', marginBottom: '16px' }}>
                <div><label style={lbl}>NDT type</label><select style={inp()} value={jointForm.ndt_type} onChange={e => setJointForm(f => ({ ...f, ndt_type: e.target.value }))}><option value="">— Type —</option>{NDT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label style={lbl}>Result</label><select style={inp()} value={jointForm.ndt_result} onChange={e => setJointForm(f => ({ ...f, ndt_result: e.target.value }))}><option value="pending">Pending</option><option value="accept">Accept</option><option value="reject">Reject</option><option value="repair">Repair</option></select></div>
                <div><label style={lbl}>Report reference</label><input style={inp()} placeholder="RT-2024-001" value={jointForm.ndt_report_ref} onChange={e => setJointForm(f => ({ ...f, ndt_report_ref: e.target.value }))} /></div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}><label style={lbl}>Remarks</label><textarea style={{ ...inp(), height: '60px', resize: 'none' as const }} value={jointForm.remarks} onChange={e => setJointForm(f => ({ ...f, remarks: e.target.value }))} /></div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={saveJoint} disabled={saving || !jointForm.joint_number} style={{ flex: 1, padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Log joint'}</button>
              <button onClick={() => setShowJointForm(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* WPS FORM */}
      {showWPSForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '560px', background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Create WPS</h2>
              <button onClick={() => setShowWPSForm(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>
            {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>WPS number *</label><input style={inp()} placeholder="WPS-001" value={wpsForm.wps_number} onChange={e => setWpsForm(f => ({ ...f, wps_number: e.target.value }))} /></div>
              <div><label style={lbl}>Revision</label><input style={inp()} value={wpsForm.revision} onChange={e => setWpsForm(f => ({ ...f, revision: e.target.value }))} /></div>
              <div><label style={lbl}>Process</label><select style={inp()} value={wpsForm.process} onChange={e => setWpsForm(f => ({ ...f, process: e.target.value }))}>{WELD_PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>Base material 1</label><input style={inp()} placeholder="SA-516 Gr.70" value={wpsForm.base_material_1} onChange={e => setWpsForm(f => ({ ...f, base_material_1: e.target.value }))} /></div>
              <div><label style={lbl}>Base material 2</label><input style={inp()} placeholder="SA-516 Gr.70 or same" value={wpsForm.base_material_2} onChange={e => setWpsForm(f => ({ ...f, base_material_2: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>Filler material</label><input style={inp()} placeholder="E7018" value={wpsForm.filler_material} onChange={e => setWpsForm(f => ({ ...f, filler_material: e.target.value }))} /></div>
              <div><label style={lbl}>Min thickness</label><input style={inp()} type="number" placeholder="6" value={wpsForm.min_thickness_mm} onChange={e => setWpsForm(f => ({ ...f, min_thickness_mm: e.target.value }))} /></div>
              <div><label style={lbl}>Max thickness</label><input style={inp()} type="number" placeholder="100" value={wpsForm.max_thickness_mm} onChange={e => setWpsForm(f => ({ ...f, max_thickness_mm: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={lbl}>Applicable code</label><select style={inp()} value={wpsForm.applicable_code} onChange={e => setWpsForm(f => ({ ...f, applicable_code: e.target.value }))}><option value="ASME_VIII_Div1">ASME VIII Div 1</option><option value="ASME_VIII_Div2">ASME VIII Div 2</option><option value="IS_2825">IS 2825</option><option value="AWS_D1_1">AWS D1.1</option><option value="IBR">IBR</option></select></div>
              <div><label style={lbl}>Preheat temp (°C)</label><input style={inp()} type="number" placeholder="10" value={wpsForm.preheat_temp_c} onChange={e => setWpsForm(f => ({ ...f, preheat_temp_c: e.target.value }))} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              <input type="checkbox" checked={wpsForm.pwht_required} onChange={e => setWpsForm(f => ({ ...f, pwht_required: e.target.checked }))} />
              PWHT required
            </label>
            {wpsForm.pwht_required && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div><label style={lbl}>PWHT temp (°C)</label><input style={inp()} type="number" placeholder="620" value={wpsForm.pwht_temp_c} onChange={e => setWpsForm(f => ({ ...f, pwht_temp_c: e.target.value }))} /></div>
                <div><label style={lbl}>Hold time (hrs)</label><input style={inp()} type="number" placeholder="2" value={wpsForm.pwht_duration_hrs} onChange={e => setWpsForm(f => ({ ...f, pwht_duration_hrs: e.target.value }))} /></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={saveWPS} disabled={saving || !wpsForm.wps_number} style={{ flex: 1, padding: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Create WPS'}</button>
              <button onClick={() => setShowWPSForm(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
