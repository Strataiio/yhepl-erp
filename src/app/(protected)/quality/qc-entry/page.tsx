/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function QCEntryPage() {
  const [buckets, setBuckets] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBucket, setSelectedBucket] = useState<any>(null)
  const [paramSchemas, setParamSchemas] = useState<any[]>([])
  const [paramLogs, setParamLogs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [projectFilter, setProjectFilter] = useState('')
  const [form, setForm] = useState({ pass_qty: '', fail_qty: '', remarks: '', result: 'pass' })
  const [paramResults, setParamResults] = useState<any[]>([])

  async function loadBuckets() {
    setLoading(true)
    const r = await fetch('/api/production/buckets?status=qc_pending')
    if (r.ok) {
      const data = await r.json()
      setBuckets(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadBuckets()
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])

  async function selectBucket(b: any) {
    setSelectedBucket(b)
    setResult(null)
    setError('')
    setForm({ pass_qty: String(b.input_qty || ''), fail_qty: '0', remarks: '', result: 'pass' })

    // Load parameter schemas for this process
    if (b.process_types?.id) {
      const sr = await fetch(`/api/masters?table=process_parameter_schemas&order=display_order`)
      const schemas = await sr.json()
      const filtered = Array.isArray(schemas) ? schemas.filter((s: any) => s.process_type_id === b.process_types.id && s.is_qc_field) : []
      setParamSchemas(filtered)

      // Load existing parameter logs for this bucket
      const lr = await fetch(`/api/production/buckets/${b.id}/machine-log`)
      // Get param logs via API
      const pr = await fetch(`/api/production/buckets/${b.id}`)
      if (pr.ok) {
        const bd = await pr.json()
        // Get process parameter logs
        const plr = await fetch(`/api/masters?table=process_parameter_logs&order=recorded_at`)
        const pLogs = await plr.json()
        const bucketLogs = Array.isArray(pLogs) ? pLogs.filter((l: any) => l.bucket_id === b.id) : []
        setParamLogs(bucketLogs)
        setParamResults(filtered.map((s: any) => {
          const log = bucketLogs.find((l: any) => l.field_key === s.field_key)
          return { field_key: s.field_key, field_name: s.field_name, value: log?.field_value_numeric?.toString() || log?.field_value_text || '', spec_min: s.spec_min, spec_max: s.spec_max, unit: s.unit, pass: null }
        }))
      }
    } else {
      setParamSchemas([])
      setParamResults([])
    }
  }

  function updateParamResult(idx: number, value: string) {
    setParamResults(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const num = parseFloat(value)
      let pass: boolean | null = null
      if (!isNaN(num)) {
        if (p.spec_min !== null && p.spec_min !== undefined && num < p.spec_min) pass = false
        else if (p.spec_max !== null && p.spec_max !== undefined && num > p.spec_max) pass = false
        else pass = true
      }
      return { ...p, value, pass }
    }))
  }

  function computeOverallResult() {
    if (paramResults.length === 0) return form.result
    const anyFail = paramResults.some(p => p.pass === false)
    const allPass = paramResults.every(p => p.pass === true)
    return anyFail ? 'fail' : allPass ? 'pass' : 'partial_pass'
  }

  async function submitQC() {
    if (!selectedBucket) return
    setSaving(true); setError('')
    try {
      const overallResult = paramResults.length > 0 ? computeOverallResult() : form.result
      const passQty = parseFloat(form.pass_qty) || 0
      const failQty = parseFloat(form.fail_qty) || 0

      const r = await fetch('/api/quality/qc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket_id: selectedBucket.id,
          project_id: selectedBucket.projects?.id || selectedBucket.project_id,
          input_qty: selectedBucket.input_qty,
          pass_qty: passQty,
          fail_qty: failQty,
          result: overallResult,
          parameter_results: paramResults.map(p => ({
            field_key: p.field_key, field_name: p.field_name,
            value: p.value, spec_min: p.spec_min, spec_max: p.spec_max,
            unit: p.unit, pass: p.pass
          })),
          remarks: form.remarks || null,
        })
      })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      setResult(data)
      loadBuckets()
      setSelectedBucket(null)
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const filtered = buckets.filter(b => !projectFilter || b.projects?.project_code === projectFilter || b.project_id === projectFilter)
  const inp = (style: any = {}) => ({ padding: '8px 11px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>
      {/* Left — QC pending buckets */}
      <div style={{ width: '380px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>QC entry</h1>
          <select style={inp()} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Loading...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              No buckets pending QC
              <div style={{ fontSize: '11px', marginTop: '6px', color: '#d1d5db' }}>Buckets appear here after WIP is closed</div>
            </div>
          )}
          {filtered.map(b => (
            <div key={b.id} onClick={() => selectBucket(b)}
              style={{ background: selectedBucket?.id === b.id ? '#eff6ff' : '#fff', border: `1px solid ${selectedBucket?.id === b.id ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '10px', padding: '12px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { if (selectedBucket?.id !== b.id) (e.currentTarget as HTMLDivElement).style.borderColor = '#cbd5e1' }}
              onMouseLeave={e => { if (selectedBucket?.id !== b.id) (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>{b.bucket_code}</span>
                <span style={{ fontSize: '11px', background: '#faf5ff', color: '#6b21a8', padding: '1px 7px', borderRadius: '10px', fontWeight: '600' }}>QC Pending</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '3px' }}>{b.process_types?.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{b.input_pt?.name} × {b.input_qty}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{b.projects?.project_code}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — QC form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        {result && (
          <div style={{ background: result.ncr ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.ncr ? '#fecaca' : '#bbf7d0'}`, borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: result.ncr ? '#dc2626' : '#065f46', marginBottom: '6px' }}>
              {result.ncr ? '⚠ QC Failed — NCR raised' : '✓ QC Passed'}
            </div>
            <div style={{ fontSize: '12px', color: '#374151' }}>
              Bucket status → <strong>{result.new_bucket_status?.replace(/_/g, ' ')}</strong>
              {result.ncr && <span style={{ marginLeft: '12px' }}>NCR: <strong>{result.ncr.ncr_number}</strong></span>}
            </div>
          </div>
        )}

        {!selectedBucket ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>⬅</div>
            <div style={{ fontSize: '14px' }}>Select a bucket from the list to start QC</div>
          </div>
        ) : (
          <div style={{ maxWidth: '680px' }}>
            {/* Bucket info */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>{selectedBucket.bucket_code}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{selectedBucket.process_types?.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{selectedBucket.input_pt?.name} × {selectedBucket.input_qty} — {selectedBucket.projects?.project_code}</div>
                </div>
                <button onClick={() => setSelectedBucket(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
            </div>

            {error && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

            {/* Parameter checks */}
            {paramSchemas.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '14px' }}>Parameter verification</div>
                {paramResults.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '10px', marginBottom: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={lbl}>{p.field_name} {p.unit ? `(${p.unit})` : ''}</label>
                      <input style={inp({ borderColor: p.pass === false ? '#fca5a5' : p.pass === true ? '#86efac' : '#e5e7eb', background: p.pass === false ? '#fef2f2' : p.pass === true ? '#f0fdf4' : '#f9fafb' })}
                        type="number" value={p.value}
                        onChange={e => updateParamResult(i, e.target.value)}
                        placeholder="Enter measured value" />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', paddingBottom: '2px' }}>
                      {p.spec_min !== null && p.spec_min !== undefined && <div>Min: {p.spec_min}</div>}
                      {p.spec_max !== null && p.spec_max !== undefined && <div>Max: {p.spec_max}</div>}
                    </div>
                    <div style={{ paddingBottom: '4px' }}>
                      {paramLogs.find((l: any) => l.field_key === p.field_key) && (
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          Logged: <strong>{paramLogs.find((l: any) => l.field_key === p.field_key)?.field_value_numeric}</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' as const, paddingBottom: '4px' }}>
                      {p.pass === true && <span style={{ fontSize: '20px', color: '#059669' }}>✓</span>}
                      {p.pass === false && <span style={{ fontSize: '20px', color: '#dc2626' }}>✗</span>}
                      {p.pass === null && <span style={{ fontSize: '20px', color: '#d1d5db' }}>○</span>}
                    </div>
                  </div>
                ))}

                {/* Overall computed result */}
                {paramResults.some(p => p.pass !== null) && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: computeOverallResult() === 'pass' ? '#f0fdf4' : computeOverallResult() === 'fail' ? '#fef2f2' : '#fffbeb', border: `1px solid ${computeOverallResult() === 'pass' ? '#86efac' : computeOverallResult() === 'fail' ? '#fca5a5' : '#fde68a'}` }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: computeOverallResult() === 'pass' ? '#065f46' : computeOverallResult() === 'fail' ? '#dc2626' : '#92400e' }}>
                      Computed result: {computeOverallResult().replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {computeOverallResult() === 'fail' && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>NCR will be auto-raised on submit</div>}
                  </div>
                )}
              </div>
            )}

            {/* Qty + result */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '14px' }}>Inspection result</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={lbl}>Pass qty</label>
                  <input style={inp({ borderColor: '#86efac', background: '#f0fdf4' })} type="number" value={form.pass_qty}
                    onChange={e => { setForm(f => ({ ...f, pass_qty: e.target.value, fail_qty: String(Math.max(0, (selectedBucket.input_qty || 0) - parseFloat(e.target.value || '0'))) })) }} />
                </div>
                <div>
                  <label style={lbl}>Fail qty</label>
                  <input style={inp({ borderColor: '#fca5a5', background: '#fef2f2' })} type="number" value={form.fail_qty}
                    onChange={e => setForm(f => ({ ...f, fail_qty: e.target.value }))} />
                </div>
              </div>

              {paramSchemas.length === 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={lbl}>Manual result</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['pass', 'fail', 'partial_pass', 'hold'].map(r => (
                      <button key={r} onClick={() => setForm(f => ({ ...f, result: r }))}
                        style={{ flex: 1, padding: '8px', border: `1.5px solid ${form.result === r ? (r === 'pass' ? '#059669' : r === 'fail' ? '#dc2626' : '#d97706') : '#e5e7eb'}`, borderRadius: '7px', background: form.result === r ? (r === 'pass' ? '#f0fdf4' : r === 'fail' ? '#fef2f2' : '#fffbeb') : '#fff', fontSize: '12px', fontWeight: '600', color: form.result === r ? (r === 'pass' ? '#065f46' : r === 'fail' ? '#dc2626' : '#92400e') : '#6b7280', cursor: 'pointer' }}>
                        {r.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={lbl}>Remarks / observations</label>
                <textarea style={{ ...inp(), height: '80px', resize: 'none' as const }} placeholder="Inspection notes, defect descriptions, measurements taken..." value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
            </div>

            <button onClick={submitQC} disabled={saving}
              style={{ width: '100%', padding: '14px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Submitting QC...' : 'Submit QC inspection'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
