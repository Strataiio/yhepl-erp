/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type Bucket = {
  id: string; bucket_code: string; status: string; input_qty: number
  planned_start_date?: string; actual_start_at?: string
  qc_pass_qty?: number; qc_fail_qty?: number; remarks?: string
  projects?: { project_code: string; name: string }
  assemblies?: { name: string }
  input_pt?: { name: string; code: string }
  process_types?: { id: string; name: string; code: string; category: string }
  process_stations?: { name: string }
  machines?: { name: string; code: string }
}
type KanbanCol = { process: any; waiting: Bucket[]; wip: Bucket[]; qc_pending: Bucket[]; qc_passed: Bucket[]; qc_failed: Bucket[]; rework: Bucket[] }

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  waiting:    { label: 'Waiting',     bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
  wip:        { label: 'WIP',         bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  qc_pending: { label: 'QC Pending',  bg: '#faf5ff', border: '#ddd6fe', text: '#5b21b6', dot: '#8b5cf6' },
  qc_passed:  { label: 'QC Passed',   bg: '#f0fdf4', border: '#bbf7d0', text: '#065f46', dot: '#10b981' },
  qc_failed:  { label: 'QC Failed',   bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#ef4444' },
  rework:     { label: 'Rework',      bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#f97316' },
  planned:    { label: 'Planned',     bg: '#f8fafc', border: '#e2e8f0', text: '#475569', dot: '#94a3b8' },
}
const CAT_COLOR: Record<string, string> = { machine: '#1e40af', labour: '#065f46', vendor: '#7c3aed' }
const KANBAN_COLS = ['waiting', 'wip', 'qc_pending', 'qc_passed', 'qc_failed', 'rework'] as const

// ─── Bucket Card ─────────────────────────────────────────────────────────────
function BucketCard({ b, onClick }: { b: Bucket; onClick: () => void }) {
  const cfg = STATUS_CFG[b.status] || STATUS_CFG.planned
  const hoursInWip = b.actual_start_at && b.status === 'wip'
    ? Math.round((Date.now() - new Date(b.actual_start_at).getTime()) / 3600000 * 10) / 10
    : null

  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: `1px solid #e5e7eb`, borderLeft: `3px solid ${cfg.dot}`, borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af' }}>{b.bucket_code}</span>
        {hoursInWip !== null && (
          <span style={{ fontSize: '10px', background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>{hoursInWip}h</span>
        )}
      </div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {b.input_pt?.name || '—'}
      </div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '5px' }}>
        Qty: <strong style={{ color: '#374151' }}>{b.input_qty}</strong>
        {b.projects && <span style={{ marginLeft: '6px', color: '#9ca3af' }}>· {b.projects.project_code}</span>}
      </div>
      {b.machines && (
        <div style={{ fontSize: '10px', color: '#6b7280', background: '#f9fafb', borderRadius: '4px', padding: '2px 6px', display: 'inline-block' }}>
          {b.machines.name}
        </div>
      )}
      {b.process_stations && (
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>{b.process_stations.name}</div>
      )}
    </div>
  )
}

// ─── Bucket Detail Panel ──────────────────────────────────────────────────────
function BucketPanel({ bucketId, onClose, onUpdated }: { bucketId: string; onClose: () => void; onUpdated: () => void }) {
  const [bucket, setBucket] = useState<any>(null)
  const [machineLogs, setMachineLogs] = useState<any[]>([])
  const [labourLogs, setLabourLogs] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'detail' | 'machine' | 'people' | 'close'>('detail')
  const [selMachine, setSelMachine] = useState('')
  const [selEmployee, setSelEmployee] = useState('')
  const [closeForm, setCloseForm] = useState({ actual_output_qty: '', remarks: '' })
  const [activeMachineLogId, setActiveMachineLogId] = useState<string | null>(null)
  const [activeLabourLogId, setActiveLabourLogId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, mlRes, llRes] = await Promise.all([
        fetch(`/api/production/buckets/${bucketId}`),
        fetch(`/api/production/buckets/${bucketId}/machine-log`),
        fetch(`/api/production/buckets/${bucketId}/labour-log`),
      ])
      if (bRes.ok) {
        const b = await bRes.json()
        setBucket(b)
        setCloseForm(f => ({ ...f, actual_output_qty: b.actual_output_qty?.toString() || b.input_qty?.toString() || '' }))
        // Pre-select default machine from process type
        if (b.process_types?.default_machine_id && !selMachine) setSelMachine(b.process_types.default_machine_id)
        if (b.assigned_machine_id && !selMachine) setSelMachine(b.assigned_machine_id)
      }
      if (mlRes.ok) {
        const logs = await mlRes.json()
        setMachineLogs(logs)
        const active = logs.find((l: any) => !l.end_at)
        setActiveMachineLogId(active?.id || null)
      }
      if (llRes.ok) {
        const logs = await llRes.json()
        setLabourLogs(logs)
        const active = logs.find((l: any) => !l.clock_out)
        setActiveLabourLogId(active?.id || null)
      }
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }, [bucketId])

  useEffect(() => {
    load()
    fetch('/api/masters?table=machines&order=name').then(r => r.json()).then(setMachines).catch(() => {})
    fetch('/api/masters?table=employees&order=full_name').then(r => r.json()).then(setEmployees).catch(() => {})
  }, [load])

  async function startWIP() {
    if (!selMachine) { setError('Select a machine first'); return }
    setSaving(true); setError('')
    try {
      // Update bucket status to WIP + assign machine
      await fetch(`/api/production/buckets/${bucketId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'wip', assigned_machine_id: selMachine, actual_start_at: new Date().toISOString() })
      })
      // Start machine log
      await fetch(`/api/production/buckets/${bucketId}/machine-log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', machine_id: selMachine })
      })
      await load(); onUpdated()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function stopMachine() {
    if (!activeMachineLogId) return
    setSaving(true); setError('')
    try {
      await fetch(`/api/production/buckets/${bucketId}/machine-log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', log_id: activeMachineLogId, stop_reason: 'normal' })
      })
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function clockInEmployee() {
    if (!selEmployee) { setError('Select an employee first'); return }
    setSaving(true); setError('')
    try {
      await fetch(`/api/production/buckets/${bucketId}/labour-log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clock_in', employee_id: selEmployee })
      })
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function clockOutEmployee() {
    if (!activeLabourLogId) return
    setSaving(true); setError('')
    try {
      await fetch(`/api/production/buckets/${bucketId}/labour-log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clock_out', log_id: activeLabourLogId })
      })
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function sendToQC() {
    setSaving(true); setError('')
    try {
      // Stop any running machine log
      if (activeMachineLogId) await fetch(`/api/production/buckets/${bucketId}/machine-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', log_id: activeMachineLogId }) })
      // Clock out any active labour
      if (activeLabourLogId) await fetch(`/api/production/buckets/${bucketId}/labour-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clock_out', log_id: activeLabourLogId }) })

      const payload: any = {
        status: 'qc_pending',
        actual_end_at: new Date().toISOString(),
        actual_output_qty: closeForm.actual_output_qty ? parseFloat(closeForm.actual_output_qty) : null,
        remarks: closeForm.remarks || null,
      }
      await fetch(`/api/production/buckets/${bucketId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      await load(); onUpdated()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
      <div style={{ width: '480px', height: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</span>
      </div>
    </div>
  )

  if (!bucket) return null
  const cfg = STATUS_CFG[bucket.status] || STATUS_CFG.planned
  const canStart = bucket.status === 'waiting' || bucket.status === 'planned'
  const isWIP = bucket.status === 'wip'

  const inp = (style: any = {}) => ({ padding: '8px 11px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  const formatTime = (t: string) => t ? new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
  const hoursInWip = bucket.actual_start_at && isWIP
    ? Math.round((Date.now() - new Date(bucket.actual_start_at).getTime()) / 3600000 * 10) / 10
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div style={{ width: '480px', height: '100vh', background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>{bucket.bucket_code}</span>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                {hoursInWip !== null && <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{hoursInWip}h in WIP</span>}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{bucket.process_types?.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{bucket.projects?.project_code} · {bucket.input_pt?.name} × {bucket.input_qty}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {/* Quick action button */}
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            {canStart && (
              <button onClick={startWIP} disabled={saving || !selMachine} style={{ flex: 1, padding: '10px', background: selMachine ? '#1e40af' : '#e5e7eb', color: selMachine ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: selMachine ? 'pointer' : 'not-allowed' }}>
                {saving ? '...' : '▶ Start WIP'}
              </button>
            )}
            {isWIP && (
              <button onClick={sendToQC} disabled={saving} style={{ flex: 1, padding: '10px', background: '#5b21b6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                {saving ? '...' : '→ Send to QC'}
              </button>
            )}
            {isWIP && (
              <button onClick={activeMachineLogId ? stopMachine : () => {}} disabled={saving || !activeMachineLogId} style={{ padding: '10px 14px', background: activeMachineLogId ? '#fef2f2' : '#f9fafb', color: activeMachineLogId ? '#dc2626' : '#9ca3af', border: `1px solid ${activeMachineLogId ? '#fecaca' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: activeMachineLogId ? 'pointer' : 'not-allowed' }}>
                {activeMachineLogId ? '⏹ Stop machine' : 'Machine stopped'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
          {[['detail', 'Details'], ['machine', `Machine (${machineLogs.length})`], ['people', `People (${labourLogs.length})`], ['close', 'Close']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t as any)} style={{ padding: '10px 14px', border: 'none', background: 'none', fontSize: '12px', fontWeight: tab === t ? '700' : '400', color: tab === t ? '#1e40af' : '#6b7280', cursor: 'pointer', borderBottom: tab === t ? '2px solid #1e40af' : '2px solid transparent', whiteSpace: 'nowrap' as const }}>{l}</button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

          {/* TAB: Detail */}
          {tab === 'detail' && (
            <div>
              {[
                ['Project', bucket.projects?.project_code + ' — ' + bucket.projects?.name],
                ['Assembly', bucket.assemblies?.name || '—'],
                ['Process', bucket.process_types?.name],
                ['Station', bucket.process_stations?.name || '—'],
                ['Input product', bucket.input_pt?.name],
                ['Input qty', bucket.input_qty],
                ['Planned date', bucket.planned_start_date ? new Date(bucket.planned_start_date).toLocaleDateString('en-IN') : '—'],
                ['Started at', formatTime(bucket.actual_start_at)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                  <span style={{ color: '#6b7280' }}>{k}</span>
                  <span style={{ color: '#111827', fontWeight: '500', textAlign: 'right' as const, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(v)}</span>
                </div>
              ))}

              {/* Machine selector — always visible here */}
              <div style={{ marginTop: '16px' }}>
                <label style={lbl}>Assigned machine {bucket.process_types?.default_machine_id && <span style={{ color: '#10b981', marginLeft: '4px' }}>· default from process</span>}</label>
                <select style={inp()} value={selMachine} onChange={e => setSelMachine(e.target.value)}>
                  <option value="">— Select machine —</option>
                  {machines.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                </select>
              </div>
            </div>
          )}

          {/* TAB: Machine */}
          {tab === 'machine' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Machine</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select style={inp()} value={selMachine} onChange={e => setSelMachine(e.target.value)}>
                    <option value="">— Select machine —</option>
                    {machines.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.code}) {m.id === bucket.process_types?.default_machine_id ? '★ default' : ''}</option>)}
                  </select>
                  {isWIP && !activeMachineLogId && (
                    <button onClick={async () => {
                      if (!selMachine) { setError('Select a machine'); return }
                      setSaving(true)
                      await fetch(`/api/production/buckets/${bucketId}/machine-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', machine_id: selMachine }) })
                      await load(); setSaving(false)
                    }} disabled={saving} style={{ padding: '8px 14px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                      Start
                    </button>
                  )}
                  {activeMachineLogId && (
                    <button onClick={stopMachine} disabled={saving} style={{ padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Stop</button>
                  )}
                </div>
              </div>

              {activeMachineLogId && (
                <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                  Machine running — {machineLogs.find(l => !l.end_at)?.machines?.name}
                </div>
              )}

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '10px' }}>Log</div>
              {machineLogs.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>No machine logs yet</div>}
              {machineLogs.map((log: any, i: number) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{log.machines?.name || '—'}</span>
                    <span style={{ color: log.end_at ? '#059669' : '#1e40af', fontWeight: '600' }}>{log.end_at ? `${log.duration_mins} min` : 'Running...'}</span>
                  </div>
                  <div style={{ color: '#6b7280' }}>{formatTime(log.start_at)} → {log.end_at ? formatTime(log.end_at) : 'now'}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: People */}
          {tab === 'people' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Employee</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select style={inp()} value={selEmployee} onChange={e => setSelEmployee(e.target.value)}>
                    <option value="">— Select employee —</option>
                    {employees.filter((e: any) => e.is_active).map((e: any) => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
                  </select>
                  {!activeLabourLogId ? (
                    <button onClick={clockInEmployee} disabled={saving || !selEmployee} style={{ padding: '8px 14px', background: selEmployee ? '#059669' : '#e5e7eb', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: selEmployee ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' as const }}>Clock in</button>
                  ) : (
                    <button onClick={clockOutEmployee} disabled={saving} style={{ padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Clock out</button>
                  )}
                </div>
              </div>

              {activeLabourLogId && (
                <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: '#065f46', fontWeight: '600' }}>
                  {labourLogs.find(l => !l.clock_out)?.employees?.full_name} — clocked in
                </div>
              )}

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '10px' }}>Log</div>
              {labourLogs.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>No labour logs yet</div>}
              {labourLogs.map((log: any, i: number) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{log.employees?.full_name || '—'}</span>
                    <span style={{ color: log.clock_out ? '#059669' : '#059669', fontWeight: '600' }}>{log.clock_out ? `${log.hours_worked}h` : 'Working...'}</span>
                  </div>
                  <div style={{ color: '#6b7280' }}>{formatTime(log.clock_in)} → {log.clock_out ? formatTime(log.clock_out) : 'now'}</div>
                  {log.cost_amount && <div style={{ color: '#374151', marginTop: '2px' }}>Cost: ₹{log.cost_amount}</div>}
                </div>
              ))}
            </div>
          )}

          {/* TAB: Close */}
          {tab === 'close' && (
            <div>
              <div style={{ background: '#fef9c3', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#854d0e' }}>
                Closing the bucket stops the machine, clocks out all employees, and sends it to QC.
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Actual output qty</label>
                <input style={inp()} type="number" value={closeForm.actual_output_qty} onChange={e => setCloseForm(f => ({ ...f, actual_output_qty: e.target.value }))} />
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Input was: {bucket.input_qty}</div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={lbl}>Remarks / notes</label>
                <textarea style={{ ...inp(), height: '80px', resize: 'vertical' as const }} placeholder="Any issues, deviations, or notes..." value={closeForm.remarks} onChange={e => setCloseForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <button onClick={sendToQC} disabled={saving || !isWIP} style={{ width: '100%', padding: '12px', background: isWIP ? '#5b21b6' : '#e5e7eb', color: isWIP ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: isWIP ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Closing...' : isWIP ? '→ Close & send to QC' : 'Bucket must be WIP to close'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Create Bucket Form ────────────────────────────────────────────────────────
function CreateBucketForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [assemblies, setAssemblies] = useState<any[]>([])
  const [processTypes, setProcessTypes] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', assembly_id: '', process_type_id: '', input_product_type_id: '', input_qty: '', planned_output_product_type_id: '', planned_output_qty: '', station_id: '', planned_start_date: '', planned_end_date: '' })

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d.filter((p: any) => p.status === 'in_production' || p.status === 'planning' || p.status === 'order_confirmed') : []))
    fetch('/api/masters?table=process_types&order=name').then(r => r.json()).then(setProcessTypes)
    fetch('/api/masters?table=product_types&order=name').then(r => r.json()).then(setProductTypes)
    fetch('/api/masters?table=process_stations&order=name').then(r => r.json()).then(setStations)
  }, [])

  useEffect(() => {
    if (form.project_id) {
      fetch(`/api/projects/${form.project_id}/assemblies`).then(r => r.json()).then(setAssemblies)
    }
  }, [form.project_id])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.project_id || !form.process_type_id || !form.input_product_type_id || !form.input_qty) { setError('Project, process, input product and qty are required'); return }
    setSaving(true); setError('')
    try {
      const payload: any = {
        project_id: form.project_id,
        process_type_id: form.process_type_id,
        input_product_type_id: form.input_product_type_id,
        input_qty: parseFloat(form.input_qty),
        status: 'waiting',
        assembly_id: form.assembly_id || null,
        planned_output_product_type_id: form.planned_output_product_type_id || null,
        planned_output_qty: form.planned_output_qty ? parseFloat(form.planned_output_qty) : null,
        station_id: form.station_id || null,
        planned_start_date: form.planned_start_date || null,
        planned_end_date: form.planned_end_date || null,
      }
      const r = await fetch('/api/production/buckets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error(await r.text())
      onCreated(); onClose()
    } catch (e) { setError(String(e)); setSaving(false) }
  }

  const inp = (style: any = {}) => ({ padding: '8px 11px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '520px', background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 }}>Create bucket</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '12px', color: '#dc2626' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div><label style={lbl}>Project *</label><select style={inp()} value={form.project_id} onChange={e => set('project_id', e.target.value)}><option value="">— Select project —</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}</select></div>
          <div><label style={lbl}>Assembly</label><select style={inp()} value={form.assembly_id} onChange={e => set('assembly_id', e.target.value)}><option value="">— None —</option>{assemblies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={lbl}>Process type *</label>
          <select style={inp()} value={form.process_type_id} onChange={e => set('process_type_id', e.target.value)}>
            <option value="">— Select process —</option>
            {processTypes.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
          </select>
        </div>

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px' }}>Input → Output transformation</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={lbl}>Input product *</label><select style={inp()} value={form.input_product_type_id} onChange={e => set('input_product_type_id', e.target.value)}><option value="">— Select —</option>{productTypes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label style={lbl}>Input qty *</label><input style={inp()} type="number" placeholder="20" value={form.input_qty} onChange={e => set('input_qty', e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Output product</label><select style={inp()} value={form.planned_output_product_type_id} onChange={e => set('planned_output_product_type_id', e.target.value)}><option value="">— Same or select —</option>{productTypes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label style={lbl}>Output qty</label><input style={inp()} type="number" placeholder="18" value={form.planned_output_qty} onChange={e => set('planned_output_qty', e.target.value)} /></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div><label style={lbl}>Station</label><select style={inp()} value={form.station_id} onChange={e => set('station_id', e.target.value)}><option value="">— Any —</option>{stations.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label style={lbl}>Planned start</label><input style={inp()} type="date" value={form.planned_start_date} onChange={e => set('planned_start_date', e.target.value)} /></div>
          <div><label style={lbl}>Planned end</label><input style={inp()} type="date" value={form.planned_end_date} onChange={e => set('planned_end_date', e.target.value)} /></div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{saving ? 'Creating...' : 'Create bucket'}</button>
          <button onClick={onClose} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Production Page ─────────────────────────────────────────────────────
export default function ProductionPage() {
  const [kanban, setKanban] = useState<KanbanCol[]>([])
  const [summary, setSummary] = useState<any>({})
  const [constraints, setConstraints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showCols, setShowCols] = useState<string[]>(['waiting', 'wip', 'qc_pending', 'qc_passed'])

  async function load() {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/production/kanban')
      if (!r.ok) throw new Error(await r.text())
      const d = await r.json()
      setKanban(d.kanban || [])
      setSummary(d.summary || {})
      setConstraints(d.constraints || [])
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totalBuckets = kanban.reduce((sum, col) =>
    sum + KANBAN_COLS.reduce((s, k) => s + (col[k]?.length || 0), 0), 0)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Production floor</h1>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
            {[['Waiting', summary.waiting, '#f59e0b'], ['WIP', summary.wip, '#3b82f6'], ['QC pending', summary.qc_pending, '#8b5cf6'], ['Total', summary.total, '#374151']].map(([l, v, c]) => (
              <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c as string }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{l}:</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{v || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {[['kanban', 'Kanban'], ['list', 'List']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v as any)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: view === v ? '#fff' : 'transparent', color: view === v ? '#0f172a' : '#6b7280' }}>{l}</button>
            ))}
          </div>
          <button onClick={load} style={{ padding: '7px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '600' }}>↻ Refresh</button>
          <button onClick={() => setShowCreate(true)} style={{ padding: '7px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ New bucket</button>
        </div>
      </div>

      {/* Station constraint bar */}
      {constraints.filter((c: any) => (c.queue_count || 0) > 0).length > 0 && (
        <div style={{ padding: '8px 28px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '12px', overflowX: 'auto', flexShrink: 0 }}>
          {constraints.filter((c: any) => (c.queue_count || 0) > 0).map((c: any) => {
            const queueHrs = parseFloat(c.queue_hours || 0)
            const cap = parseFloat(c.daily_capacity_hrs || 8)
            const pct = cap > 0 ? Math.min(Math.round((queueHrs / cap) * 100), 100) : 0
            return (
              <div key={c.station_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: pct > 80 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', padding: '6px 12px', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: pct > 80 ? '#dc2626' : '#059669' }}>{c.station_name}</div>
                <div style={{ width: '60px', height: '4px', background: '#e5e7eb', borderRadius: '2px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? '#ef4444' : '#10b981', borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Q:{c.queue_count} W:{c.active_wip_count}</div>
              </div>
            )
          })}
        </div>
      )}

      {error && <div style={{ padding: '12px 28px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '20px 28px', display: 'flex', gap: '0' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: '#9ca3af', fontSize: '14px' }}>Loading production data...</div>
          ) : kanban.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '12px' }}>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>No active buckets yet</div>
              <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Create your first bucket</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0', minWidth: 'max-content', height: '100%' }}>
              {/* Process rows = vertical lanes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', minWidth: '140px', marginRight: '0' }}>
                <div style={{ height: '44px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 12px', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Process</span>
                </div>
                {kanban.map(col => (
                  <div key={col.process.id} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #e5e7eb', background: '#f9fafb', minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '3px' }}>{col.process.name}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', background: col.process.category === 'machine' ? '#dbeafe' : col.process.category === 'labour' ? '#d1fae5' : '#ede9fe', color: CAT_COLOR[col.process.category] || '#374151' }}>{col.process.category}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status columns */}
              {(showCols as any[]).map(colKey => {
                const cfg = STATUS_CFG[colKey]
                return (
                  <div key={colKey} style={{ display: 'flex', flexDirection: 'column', minWidth: '200px', borderRight: '1px solid #e5e7eb' }}>
                    <div style={{ height: '44px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '6px', background: '#f9fafb', flexShrink: 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.dot }} />
                      <span style={{ fontSize: '11px', fontWeight: '700', color: cfg.text }}>{cfg.label}</span>
                      <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '2px' }}>
                        ({kanban.reduce((s, c) => s + (c[colKey as keyof KanbanCol] as any[] || []).length, 0)})
                      </span>
                    </div>
                    {kanban.map(processCol => {
                      const buckets = (processCol[colKey as keyof KanbanCol] as Bucket[]) || []
                      return (
                        <div key={processCol.process.id} style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', minHeight: '160px', background: buckets.length > 0 ? '#fff' : '#fafafa', overflowY: 'auto' }}>
                          {buckets.map(b => (
                            <BucketCard key={b.id} b={b} onClick={() => setSelectedBucketId(b.id)} />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Column toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 6px', gap: '4px', borderLeft: 'none' }}>
                <div style={{ height: '44px', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' as const }}>Cols</span>
                </div>
                {KANBAN_COLS.map(k => (
                  <button key={k} onClick={() => setShowCols(prev => prev.includes(k) ? prev.filter(c => c !== k) : [...prev, k])}
                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: showCols.includes(k) ? STATUS_CFG[k].bg : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: showCols.includes(k) ? STATUS_CFG[k].dot : '#d1d5db' }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Bucket', 'Process', 'Input', 'Qty', 'Project', 'Status', 'Station', 'Planned date', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>}
                {!loading && totalBuckets === 0 && <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No active buckets</td></tr>}
                {kanban.flatMap(col =>
                  KANBAN_COLS.flatMap(k => (col[k] || []).map((b: Bucket) => (
                    <tr key={b.id} onClick={() => setSelectedBucketId(b.id)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>{b.bucket_code}</td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>{b.process_types?.name}</td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{b.input_pt?.name}</td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{b.input_qty}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{b.projects?.project_code}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: STATUS_CFG[b.status]?.bg || '#f9fafb', color: STATUS_CFG[b.status]?.text || '#374151' }}>{STATUS_CFG[b.status]?.label || b.status}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{b.process_stations?.name || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{b.planned_start_date ? new Date(b.planned_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '16px', color: '#d1d5db' }}>›</td>
                    </tr>
                  )))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bucket detail panel */}
      {selectedBucketId && (
        <BucketPanel bucketId={selectedBucketId} onClose={() => setSelectedBucketId(null)} onUpdated={load} />
      )}

      {/* Create bucket form */}
      {showCreate && (
        <CreateBucketForm onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  )
}
