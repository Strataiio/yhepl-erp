/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState, useCallback } from 'react'

// ─── Status config — 3 core states per bucket ────────────────────────────────
const S: Record<string, { label: string; bg: string; border: string; text: string; dot: string; short: string }> = {
  waiting:    { label: 'Waiting',    bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b', short: 'W' },
  wip:        { label: 'WIP',        bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6', short: 'W' },
  done:       { label: 'Done',       bg: '#f0fdf4', border: '#bbf7d0', text: '#065f46', dot: '#10b981', short: 'D' },
  qc_pending: { label: 'QC Review',  bg: '#faf5ff', border: '#ddd6fe', text: '#5b21b6', dot: '#8b5cf6', short: 'Q' },
  qc_failed:  { label: 'QC Failed',  bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#ef4444', short: 'F' },
  rework:     { label: 'Rework',     bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#f97316', short: 'R' },
}
const CAT: Record<string, string> = { machine: '#1e40af', labour: '#059669', vendor: '#7c3aed' }
const COLS = ['waiting', 'wip', 'done'] as const

const inp = (style: any = {}) => ({ padding: '8px 11px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
const lbl = { fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

// ─── Bucket Card ──────────────────────────────────────────────────────────────
function BucketCard({ b, onClick, status }: { b: any; onClick: () => void; status: string }) {
  const cfg = S[status] || S.waiting
  const hrs = b.actual_start_at && status === 'wip'
    ? Math.round((Date.now() - new Date(b.actual_start_at).getTime()) / 3600000 * 10) / 10 : null
  const elapsed = b.actual_start_at && b.actual_end_at && status === 'done'
    ? Math.round((new Date(b.actual_end_at).getTime() - new Date(b.actual_start_at).getTime()) / 3600000 * 10) / 10 : null

  return (
    <div onClick={onClick} style={{ background: '#fff', borderLeft: `3px solid ${cfg.dot}`, border: `1px solid ${cfg.border}`, borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', marginBottom: '7px', transition: 'all 0.12s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e40af', letterSpacing: '0.02em' }}>{b.bucket_code}</span>
        {hrs !== null && <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>{hrs}h ▶</span>}
        {elapsed !== null && <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>{elapsed}h ✓</span>}
      </div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {b.input_pt?.name || '—'}
      </div>
      <div style={{ fontSize: '11px', color: '#6b7280' }}>
        <strong style={{ color: '#374151' }}>{b.input_qty}</strong> units
        {b.projects && <span style={{ color: '#9ca3af' }}> · {b.projects.project_code}</span>}
      </div>
      {b.machines && <div style={{ fontSize: '10px', color: '#1e40af', background: '#eff6ff', borderRadius: '4px', padding: '2px 6px', display: 'inline-block', marginTop: '4px' }}>{b.machines.name}</div>}
      {b.parent_bucket_id && <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>↳ from prev process</div>}
    </div>
  )
}

// ─── Bucket Panel ─────────────────────────────────────────────────────────────
function BucketPanel({ bucketId, onClose, onUpdated }: { bucketId: string; onClose: () => void; onUpdated: () => void }) {
  const [bucket, setBucket] = useState<any>(null)
  const [machineLogs, setMachineLogs] = useState<any[]>([])
  const [labourLogs, setLabourLogs] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [processTypes, setProcessTypes] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [fgHistory, setFgHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'info' | 'people' | 'output'>('info')
  const [selMachine, setSelMachine] = useState('')
  const [selEmployee, setSelEmployee] = useState('')
  const [activeMachineLogId, setActiveMachineLogId] = useState<string | null>(null)
  const [activeLabourLogId, setActiveLabourLogId] = useState<string | null>(null)
  const [outputForm, setOutputForm] = useState({
    accepted_qty: '', rejected_qty: '0', destination: 'inventory',
    next_process_type_id: '', next_input_product_type_id: '', location_id: '', notes: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, mlRes, llRes, fgRes] = await Promise.all([
        fetch(`/api/production/buckets/${bucketId}`),
        fetch(`/api/production/buckets/${bucketId}/machine-log`),
        fetch(`/api/production/buckets/${bucketId}/labour-log`),
        fetch(`/api/production/finished-goods?bucket_id=${bucketId}`),
      ])
      if (bRes.ok) {
        const b = await bRes.json()
        setBucket(b)
        setOutputForm(f => ({ ...f, accepted_qty: String(b.input_qty || ''), next_input_product_type_id: b.planned_output_product_type_id || b.input_product_type_id || '' }))
        if (b.process_types?.default_machine_id && !selMachine) setSelMachine(b.process_types.default_machine_id)
        if (b.assigned_machine_id && !selMachine) setSelMachine(b.assigned_machine_id)
      }
      if (mlRes.ok) { const logs = await mlRes.json(); setMachineLogs(Array.isArray(logs) ? logs : []); const a = (Array.isArray(logs) ? logs : []).find((l: any) => !l.end_at); setActiveMachineLogId(a?.id || null) }
      if (llRes.ok) { const logs = await llRes.json(); setLabourLogs(Array.isArray(logs) ? logs : []); const a = (Array.isArray(logs) ? logs : []).find((l: any) => !l.clock_out); setActiveLabourLogId(a?.id || null) }
      if (fgRes.ok) setFgHistory(await fgRes.json())
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }, [bucketId])

  useEffect(() => {
    load()
    fetch('/api/masters?table=machines&order=name').then(r => r.json()).then(d => setMachines(Array.isArray(d) ? d : []))
    fetch('/api/hr/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d.filter((e: any) => e.is_active) : []))
    fetch('/api/masters?table=process_types&order=name').then(r => r.json()).then(d => setProcessTypes(Array.isArray(d) ? d : []))
    fetch('/api/masters?table=product_types&order=name').then(r => r.json()).then(d => setProductTypes(Array.isArray(d) ? d : []))
    fetch('/api/masters?table=stock_locations&order=name').then(r => r.json()).then(d => setLocations(Array.isArray(d) ? d : []))
  }, [load])

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '500px', height: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
    </div>
  )
  if (!bucket) return null

  const isWaiting = bucket.status === 'waiting'
  const isWIP = bucket.status === 'wip'
  const isDone = bucket.status === 'qc_passed'
  const isClosed = bucket.status === 'closed'
  const displayStatus = isDone ? 'done' : bucket.status
  const cfg = S[displayStatus] || S.waiting

  const fmtTime = (t: string) => t ? new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
  const wipHrs = bucket.actual_start_at && isWIP ? Math.round((Date.now() - new Date(bucket.actual_start_at).getTime()) / 3600000 * 10) / 10 : null
  const totalHrs = bucket.actual_start_at && bucket.actual_end_at ? Math.round((new Date(bucket.actual_end_at).getTime() - new Date(bucket.actual_start_at).getTime()) / 3600000 * 10) / 10 : null

  async function startWIP() {
    if (!selMachine) { setError('Select a machine first'); return }
    setSaving(true); setError('')
    try {
      await fetch(`/api/production/buckets/${bucketId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'wip', assigned_machine_id: selMachine, actual_start_at: new Date().toISOString() }) })
      await fetch(`/api/production/buckets/${bucketId}/machine-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', machine_id: selMachine }) })
      await load(); onUpdated()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function markDone() {
    setSaving(true); setError('')
    try {
      if (activeMachineLogId) await fetch(`/api/production/buckets/${bucketId}/machine-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', log_id: activeMachineLogId }) })
      if (activeLabourLogId) await fetch(`/api/production/buckets/${bucketId}/labour-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clock_out', log_id: activeLabourLogId }) })
      await fetch(`/api/production/buckets/${bucketId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'qc_passed', actual_end_at: new Date().toISOString() }) })
      await load(); onUpdated()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function clockIn() {
    if (!selEmployee) { setError('Select employee'); return }
    setSaving(true); setError('')
    try {
      await fetch(`/api/production/buckets/${bucketId}/labour-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clock_in', employee_id: selEmployee }) })
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function clockOut() {
    if (!activeLabourLogId) return
    setSaving(true); setError('')
    try {
      await fetch(`/api/production/buckets/${bucketId}/labour-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clock_out', log_id: activeLabourLogId }) })
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function recordOutput() {
    if (!outputForm.accepted_qty) { setError('Enter accepted qty'); return }
    if (outputForm.destination === 'next_process' && !outputForm.next_process_type_id) { setError('Select next process'); return }
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/production/finished-goods', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket_id: bucketId, project_id: bucket.project_id, product_type_id: bucket.planned_output_product_type_id || bucket.input_product_type_id, ...outputForm })
      })
      if (!r.ok) throw new Error(await r.text())
      await load(); onUpdated()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '500px', height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af' }}>{bucket.bucket_code}</span>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                {wipHrs !== null && <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{wipHrs}h running</span>}
                {totalHrs !== null && isDone && <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{totalHrs}h total</span>}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{bucket.process_types?.name}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>
                {bucket.projects?.project_code} · {bucket.input_pt?.name} × {bucket.input_qty}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            {isWaiting && (
              <button onClick={startWIP} disabled={saving || !selMachine}
                style={{ flex: 1, padding: '9px', background: selMachine ? '#1e40af' : '#e5e7eb', color: selMachine ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: selMachine ? 'pointer' : 'not-allowed' }}>
                {saving ? '...' : '▶ Start WIP'}
              </button>
            )}
            {isWIP && (
              <>
                <button onClick={markDone} disabled={saving}
                  style={{ flex: 1, padding: '9px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {saving ? '...' : '✓ Mark Done'}
                </button>
                {activeMachineLogId && (
                  <button onClick={async () => { setSaving(true); await fetch(`/api/production/buckets/${bucketId}/machine-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', log_id: activeMachineLogId }) }); await load(); setSaving(false) }}
                    style={{ padding: '9px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    ⏹ Stop machine
                  </button>
                )}
              </>
            )}
            {isDone && !isClosed && (
              <button onClick={() => setTab('output')}
                style={{ flex: 1, padding: '9px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                → Record output
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          {[['info', 'Info & Machine'], ['people', `People (${labourLogs.length})`], ['output', 'Output & Dispatch']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              style={{ flex: 1, padding: '10px 6px', border: 'none', background: 'none', fontSize: '12px', fontWeight: tab === t ? '700' : '400', color: tab === t ? '#1e40af' : '#6b7280', cursor: 'pointer', borderBottom: tab === t ? '2px solid #1e40af' : '2px solid transparent' }}>{l}</button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '20px 22px', overflowY: 'auto' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

          {/* ── INFO & MACHINE TAB ── */}
          {tab === 'info' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '16px' }}>
                {[
                  ['Project', `${bucket.projects?.project_code} — ${bucket.projects?.name}`],
                  ['Assembly', bucket.assemblies?.name || '—'],
                  ['Process', bucket.process_types?.name],
                  ['Station', bucket.process_stations?.name || '—'],
                  ['Input product', bucket.input_pt?.name],
                  ['Input qty', bucket.input_qty],
                  ['Started', fmtTime(bucket.actual_start_at)],
                  ['Done at', fmtTime(bucket.actual_end_at)],
                  ['Pass qty', bucket.qc_pass_qty ?? '—'],
                  ['Reject qty', bucket.qc_fail_qty ?? '—'],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '12px' }}>
                    <div style={{ color: '#94a3b8', marginBottom: '1px' }}>{k}</div>
                    <div style={{ color: '#111827', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{String(v)}</div>
                  </div>
                ))}
              </div>

              {/* Machine selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Assigned machine {bucket.process_types?.default_machine_id && <span style={{ color: '#10b981' }}>· process default</span>}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select style={inp({ flex: 1 })} value={selMachine} onChange={e => setSelMachine(e.target.value)}>
                    <option value="">— Select machine —</option>
                    {machines.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.code}){m.id === bucket.process_types?.default_machine_id ? ' ★' : ''}</option>)}
                  </select>
                  {isWIP && !activeMachineLogId && (
                    <button onClick={async () => { if (!selMachine) return; setSaving(true); await fetch(`/api/production/buckets/${bucketId}/machine-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', machine_id: selMachine }) }); await load(); setSaving(false) }}
                      style={{ padding: '8px 14px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Start</button>
                  )}
                </div>
              </div>

              {/* Machine log */}
              {machineLogs.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>Machine log</div>
                  {machineLogs.map((log: any, i: number) => (
                    <div key={i} style={{ background: log.end_at ? '#f9fafb' : '#eff6ff', borderRadius: '7px', padding: '9px 11px', marginBottom: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{log.machines?.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>{fmtTime(log.start_at)} → {log.end_at ? fmtTime(log.end_at) : <span style={{ color: '#1e40af', fontWeight: '600' }}>Running</span>}</div>
                      </div>
                      <div style={{ fontWeight: '700', color: log.end_at ? '#059669' : '#1e40af' }}>{log.duration_mins ? `${log.duration_mins}m` : '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PEOPLE TAB ── */}
          {tab === 'people' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Employee</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select style={inp({ flex: 1 })} value={selEmployee} onChange={e => setSelEmployee(e.target.value)}>
                    <option value="">— Select employee —</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
                  </select>
                  {!activeLabourLogId
                    ? <button onClick={clockIn} disabled={saving || !selEmployee} style={{ padding: '8px 14px', background: selEmployee ? '#059669' : '#e5e7eb', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: selEmployee ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' as const }}>Clock in</button>
                    : <button onClick={clockOut} disabled={saving} style={{ padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Clock out</button>
                  }
                </div>
                {activeLabourLogId && (
                  <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '8px 10px', marginTop: '8px', fontSize: '12px', color: '#065f46', fontWeight: '600' }}>
                    ● {labourLogs.find(l => !l.clock_out)?.employees?.full_name} — clocked in
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>
                Labour log — {labourLogs.reduce((s, l) => s + (l.hours_worked || 0), 0).toFixed(1)} total hours
              </div>
              {labourLogs.length === 0 && <div style={{ color: '#94a3b8', fontSize: '13px' }}>No one clocked in yet</div>}
              {labourLogs.map((log: any, i: number) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: '7px', padding: '9px 11px', marginBottom: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{log.employees?.full_name}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px' }}>{fmtTime(log.clock_in)} → {log.clock_out ? fmtTime(log.clock_out) : <span style={{ color: '#059669', fontWeight: '600' }}>Working</span>}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#059669' }}>{log.hours_worked ? `${log.hours_worked}h` : '—'}</div>
                    {log.cost_amount && <div style={{ fontSize: '11px', color: '#6b7280' }}>₹{log.cost_amount}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── OUTPUT & DISPATCH TAB ── */}
          {tab === 'output' && (
            <div>
              {/* FG History */}
              {fgHistory.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '8px' }}>Output already recorded</div>
                  {fgHistory.map((fg: any) => (
                    <div key={fg.id} style={{ fontSize: '12px', color: '#374151' }}>
                      <span style={{ fontWeight: '600' }}>{fg.record_code}</span> · ✓ {fg.accepted_qty} accepted, ✗ {fg.rejected_qty} rejected → <span style={{ color: '#7c3aed', fontWeight: '600' }}>{fg.destination?.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}

              {!isClosed && (
                <>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
                    Record output quantities and choose what happens next. This closes the bucket.
                  </div>

                  {/* Qty split */}
                  <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>Output quantities (input was {bucket.input_qty})</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ ...lbl, color: '#065f46' }}>✓ Accepted qty</label>
                        <input style={inp({ borderColor: '#86efac', background: '#f0fdf4' })} type="number"
                          value={outputForm.accepted_qty}
                          onChange={e => { const a = e.target.value; setOutputForm(f => ({ ...f, accepted_qty: a, rejected_qty: String(Math.max(0, (bucket.input_qty || 0) - parseFloat(a || '0'))) })) }} />
                      </div>
                      <div>
                        <label style={{ ...lbl, color: '#dc2626' }}>✗ Rejected qty</label>
                        <input style={inp({ borderColor: '#fca5a5', background: '#fef2f2' })} type="number"
                          value={outputForm.rejected_qty}
                          onChange={e => setOutputForm(f => ({ ...f, rejected_qty: e.target.value }))} />
                      </div>
                    </div>
                    {outputForm.accepted_qty && outputForm.rejected_qty && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                        Yield: {Math.round(parseFloat(outputForm.accepted_qty) / bucket.input_qty * 100)}% · Rejection: {Math.round(parseFloat(outputForm.rejected_qty) / bucket.input_qty * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>What happens to accepted qty?</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                      {[
                        ['next_process', '→ Next process', '#1e40af'],
                        ['inventory', '📦 Inventory / Store', '#065f46'],
                        ['dispatch', '🚚 Dispatch directly', '#7c3aed'],
                        ['sfg', '🏭 Semi-finished goods', '#b45309'],
                      ].map(([val, label, color]) => (
                        <button key={val} onClick={() => setOutputForm(f => ({ ...f, destination: val }))}
                          style={{ padding: '8px 10px', border: `1.5px solid ${outputForm.destination === val ? color : '#e5e7eb'}`, borderRadius: '7px', background: outputForm.destination === val ? color + '11' : '#fff', color: outputForm.destination === val ? color : '#6b7280', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' as const }}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {outputForm.destination === 'next_process' && (
                      <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>Push to next process</div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={lbl}>Next process *</label>
                          <select style={inp()} value={outputForm.next_process_type_id} onChange={e => setOutputForm(f => ({ ...f, next_process_type_id: e.target.value }))}>
                            <option value="">— Select next process —</option>
                            {processTypes.filter(p => p.id !== bucket.process_type_id).map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Input product for next bucket</label>
                          <select style={inp()} value={outputForm.next_input_product_type_id} onChange={e => setOutputForm(f => ({ ...f, next_input_product_type_id: e.target.value }))}>
                            <option value="">— Same as output —</option>
                            {productTypes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                          Creates a new Waiting bucket for the next process, traceable to this bucket
                        </div>
                      </div>
                    )}

                    {outputForm.destination !== 'next_process' && (
                      <div>
                        <label style={lbl}>Store location</label>
                        <select style={inp()} value={outputForm.location_id} onChange={e => setOutputForm(f => ({ ...f, location_id: e.target.value }))}>
                          <option value="">— Select location —</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={lbl}>Notes</label>
                    <textarea style={{ ...inp(), height: '60px', resize: 'none' as const }} placeholder="Any remarks on output, quality, deviations..." value={outputForm.notes} onChange={e => setOutputForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>

                  <button onClick={recordOutput} disabled={saving}
                    style={{ width: '100%', padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Recording...' : `Record output & close bucket →`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Create Bucket Form ───────────────────────────────────────────────────────
function CreateBucketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [assemblies, setAssemblies] = useState<any[]>([])
  const [processTypes, setProcessTypes] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', assembly_id: '', process_type_id: '', input_product_type_id: '', input_qty: '', planned_output_product_type_id: '', planned_output_qty: '', station_id: '', planned_start_date: '', planned_end_date: '' })

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
    fetch('/api/masters?table=process_types&order=name').then(r => r.json()).then(d => setProcessTypes(Array.isArray(d) ? d : []))
    fetch('/api/masters?table=product_types&order=name').then(r => r.json()).then(d => setProductTypes(Array.isArray(d) ? d : []))
    fetch('/api/masters?table=process_stations&order=name').then(r => r.json()).then(d => setStations(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    if (form.project_id) fetch(`/api/projects/${form.project_id}/assemblies`).then(r => r.json()).then(d => setAssemblies(Array.isArray(d) ? d : []))
  }, [form.project_id])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.project_id || !form.process_type_id || !form.input_product_type_id || !form.input_qty) { setError('Project, process, product and qty are required'); return }
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/production/buckets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, input_qty: parseFloat(form.input_qty), planned_output_qty: form.planned_output_qty ? parseFloat(form.planned_output_qty) : null, assembly_id: form.assembly_id || null, planned_output_product_type_id: form.planned_output_product_type_id || null, station_id: form.station_id || null, planned_start_date: form.planned_start_date || null, planned_end_date: form.planned_end_date || null, status: 'waiting' })
      })
      if (!r.ok) throw new Error(await r.text())
      onCreated(); onClose()
    } catch (e) { setError(String(e)); setSaving(false) }
  }

  const selectedProcess = processTypes.find(p => p.id === form.process_type_id)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '540px', background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 }}>Create bucket</h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>One bucket = one product batch going through one process</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
        </div>
        {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

        {/* Step 1 — Project & Process */}
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px' }}>1. Project & process</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div><label style={lbl}>Project *</label><select style={inp()} value={form.project_id} onChange={e => set('project_id', e.target.value)}><option value="">— Select —</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}</select></div>
            <div><label style={lbl}>Assembly</label><select style={inp()} value={form.assembly_id} onChange={e => set('assembly_id', e.target.value)}><option value="">— None —</option>{assemblies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          </div>
          <div>
            <label style={lbl}>Process *</label>
            <select style={inp()} value={form.process_type_id} onChange={e => set('process_type_id', e.target.value)}>
              <option value="">— Select process —</option>
              {processTypes.map((p: any) => <option key={p.id} value={p.id}>{p.name} · {p.category} {p.default_machine_id ? '★' : ''}</option>)}
            </select>
            {selectedProcess && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Category: {selectedProcess.category}{selectedProcess.default_machine_id ? ' · has default machine' : ''}</div>}
          </div>
        </div>

        {/* Step 2 — Product transformation */}
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px' }}>2. Product in → out</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div><label style={lbl}>Input product *</label><select style={inp()} value={form.input_product_type_id} onChange={e => set('input_product_type_id', e.target.value)}><option value="">— Select —</option>{productTypes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label style={lbl}>Input qty *</label><input style={inp()} type="number" placeholder="20" value={form.input_qty} onChange={e => set('input_qty', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 10px', color: '#94a3b8', fontSize: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span>transforms into</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Output product (if different)</label><select style={inp()} value={form.planned_output_product_type_id} onChange={e => set('planned_output_product_type_id', e.target.value)}><option value="">— Same as input —</option>{productTypes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label style={lbl}>Expected out qty</label><input style={inp()} type="number" placeholder="20" value={form.planned_output_qty} onChange={e => set('planned_output_qty', e.target.value)} /></div>
          </div>
        </div>

        {/* Step 3 — Scheduling */}
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px' }}>3. Station & dates (optional)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Station</label><select style={inp()} value={form.station_id} onChange={e => set('station_id', e.target.value)}><option value="">— Any —</option>{stations.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label style={lbl}>Planned start</label><input style={inp()} type="date" value={form.planned_start_date} onChange={e => set('planned_start_date', e.target.value)} /></div>
            <div><label style={lbl}>Planned end</label><input style={inp()} type="date" value={form.planned_end_date} onChange={e => set('planned_end_date', e.target.value)} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            {saving ? 'Creating...' : '+ Create bucket (Waiting)'}
          </button>
          <button onClick={onClose} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '9px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductionPage() {
  const [kanban, setKanban] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showCols, setShowCols] = useState<string[]>(['waiting', 'wip', 'done'])

  async function load() {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/production/kanban')
      if (!r.ok) throw new Error(await r.text())
      const d = await r.json()
      setKanban(d.kanban || [])
      setSummary(d.summary || {})
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Build flat list for list view
  const allBuckets = kanban.flatMap(col =>
    ['waiting', 'wip', 'done', 'qc_pending', 'qc_failed', 'rework'].flatMap(k =>
      (col[k] || []).map((b: any) => ({ ...b, _col: k }))
    )
  )

  const COL_CFG: Record<string, { label: string; dot: string; bg: string }> = {
    waiting:    { label: 'Waiting',   dot: '#f59e0b', bg: '#fffbeb' },
    wip:        { label: 'WIP',       dot: '#3b82f6', bg: '#eff6ff' },
    done:       { label: 'Done',      dot: '#10b981', bg: '#f0fdf4' },
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Production floor</h1>
          <div style={{ display: 'flex', gap: '18px', marginTop: '5px' }}>
            {[
              { label: 'Waiting', val: summary.waiting, color: '#f59e0b' },
              { label: 'WIP', val: summary.wip, color: '#3b82f6' },
              { label: 'Done', val: summary.done, color: '#10b981' },
              { label: 'Total active', val: summary.total, color: '#374151' },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: k.color }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{k.label}:</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{k.val || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {[['kanban', 'Kanban'], ['list', 'List']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v as any)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: view === v ? '#fff' : 'transparent', color: view === v ? '#0f172a' : '#6b7280' }}>{l}</button>
            ))}
          </div>
          <button onClick={load} style={{ padding: '7px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>↻</button>
          <button onClick={() => setShowCreate(true)} style={{ padding: '7px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ New bucket</button>
        </div>
      </div>

      {error && <div style={{ padding: '10px 24px', background: '#fef2f2', fontSize: '13px', color: '#dc2626', flexShrink: 0 }}>{error}</div>}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '16px 24px', display: 'flex' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
          ) : kanban.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '12px' }}>
              <div style={{ fontSize: '40px', opacity: 0.2 }}>🏭</div>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>No active buckets</div>
              <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Create first bucket</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0', minWidth: 'max-content', height: '100%' }}>
              {/* Process label column */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '160px', borderRight: '1px solid #e5e7eb' }}>
                <div style={{ height: '46px', display: 'flex', alignItems: 'center', padding: '0 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Process</span>
                </div>
                {kanban.map(col => (
                  <div key={col.process.id} style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6', minHeight: '170px', background: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{col.process.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: CAT[col.process.category] || '#94a3b8' }} />
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>{col.process.category}</span>
                    </div>
                    {/* Mini count strip */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {[['waiting', col.waiting?.length], ['wip', col.wip?.length], ['done', col.done?.length]].map(([k, c]) => (c as number) > 0 ? (
                        <span key={k as string} style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '8px', background: (S[k as string] || S.waiting).bg, color: (S[k as string] || S.waiting).text }}>{c}</span>
                      ) : null)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status columns */}
              {(showCols as string[]).map(colKey => {
                const cfg = COL_CFG[colKey] || { label: colKey, dot: '#94a3b8', bg: '#f9fafb' }
                const colTotal = kanban.reduce((s, c) => s + ((c[colKey] || []).length), 0)
                return (
                  <div key={colKey} style={{ display: 'flex', flexDirection: 'column', minWidth: '210px', borderRight: '1px solid #e5e7eb' }}>
                    <div style={{ height: '46px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: cfg.dot }} />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>{cfg.label}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>({colTotal})</span>
                    </div>
                    {kanban.map(processCol => {
                      const buckets = (processCol[colKey] || []) as any[]
                      return (
                        <div key={processCol.process.id} style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', minHeight: '170px', background: buckets.length > 0 ? '#fff' : '#fafafa', overflowY: 'auto' }}>
                          {buckets.map(b => <BucketCard key={b.id} b={b} status={colKey} onClick={() => setSelectedBucketId(b.id)} />)}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Bucket', 'Process', 'Product', 'Qty', 'Project', 'Status', 'Time', 'Machine', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
                {!loading && allBuckets.length === 0 && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No active buckets</td></tr>}
                {allBuckets.map((b: any) => {
                  const cfg = S[b._col] || S.waiting
                  const hrs = b.actual_start_at && b._col === 'wip'
                    ? Math.round((Date.now() - new Date(b.actual_start_at).getTime()) / 3600000 * 10) / 10 : null
                  const total = b.actual_start_at && b.actual_end_at
                    ? Math.round((new Date(b.actual_end_at).getTime() - new Date(b.actual_start_at).getTime()) / 3600000 * 10) / 10 : null
                  return (
                    <tr key={b.id} onClick={() => setSelectedBucketId(b.id)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '800', color: '#1e40af' }}>{b.bucket_code}</td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>{b.process_types?.name}</td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{b.input_pt?.name}</td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{b.input_qty}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{b.projects?.project_code}</td>
                      <td style={{ padding: '11px 14px' }}><span style={{ padding: '2px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: cfg.bg, color: cfg.text }}>{cfg.label}</span></td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>{hrs !== null ? `${hrs}h ▶` : total !== null ? `${total}h` : '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{b.machines?.name || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '16px', color: '#d1d5db' }}>›</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedBucketId && <BucketPanel bucketId={selectedBucketId} onClose={() => setSelectedBucketId(null)} onUpdated={load} />}
      {showCreate && <CreateBucketModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}
