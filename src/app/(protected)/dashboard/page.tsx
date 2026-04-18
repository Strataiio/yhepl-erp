/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PROCESS_CAT_COLOR: Record<string, string> = {
  machine: '#3b82f6', labour: '#10b981', vendor: '#8b5cf6',
}

const STATUS_DOT: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  waiting:    { bg: '#fefce8', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
  wip:        { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  qc_pending: { bg: '#faf5ff', border: '#ddd6fe', text: '#5b21b6', dot: '#8b5cf6' },
  qc_passed:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#065f46', dot: '#10b981' },
  qc_failed:  { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#ef4444' },
  rework:     { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#f97316' },
}

const PROJECT_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  enquiry:         { bg: '#f1f5f9', color: '#475569', label: 'Enquiry' },
  order_confirmed: { bg: '#eff6ff', color: '#1e40af', label: 'Confirmed' },
  planning:        { bg: '#fefce8', color: '#854d0e', label: 'Planning' },
  in_production:   { bg: '#f0fdf4', color: '#065f46', label: 'In Production' },
  qc_pending:      { bg: '#faf5ff', color: '#6b21a8', label: 'QC Pending' },
  dispatched:      { bg: '#ecfdf5', color: '#065f46', label: 'Dispatched' },
}

function KPICard({ label, value, sub, color, onClick }: { label: string; value: number | string; sub?: string; color: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s' }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')}>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{sub}</div>}
    </div>
  )
}

function ProcessFlowBar({ item }: { item: any }) {
  const total = item.waiting + item.wip + item.qc_pending + item.qc_passed + item.qc_failed + item.rework
  if (total === 0) return null
  const catColor = PROCESS_CAT_COLOR[item.process?.category] || '#94a3b8'

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: catColor }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{item.process?.name}</span>
          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: catColor + '15', color: catColor, fontWeight: '600' }}>{item.process?.category}</span>
        </div>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>{total} buckets</span>
      </div>
      {/* Segmented bar */}
      <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '1px' }}>
        {[
          ['waiting', item.waiting],
          ['wip', item.wip],
          ['qc_pending', item.qc_pending],
          ['qc_passed', item.qc_passed],
          ['qc_failed', item.qc_failed],
          ['rework', item.rework],
        ].filter(([, c]) => (c as number) > 0).map(([s, c]) => (
          <div key={s as string} title={`${s}: ${c}`}
            style={{ flex: c as number, background: STATUS_DOT[s as string]?.dot || '#d1d5db', minWidth: '4px', borderRadius: '2px' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' as const }}>
        {[['waiting', item.waiting], ['wip', item.wip], ['qc_pending', item.qc_pending], ['qc_passed', item.qc_passed], ['qc_failed', item.qc_failed], ['rework', item.rework]]
          .filter(([, c]) => (c as number) > 0)
          .map(([s, c]) => (
            <span key={s as string} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: STATUS_DOT[s as string]?.text || '#374151' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>{c as number}</span>
              <span style={{ color: '#94a3b8' }}>{(s as string).replace('_', ' ')}</span>
            </span>
          ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/dashboard')
      if (!r.ok) throw new Error(await r.text())
      setData(await r.json())
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Get user name
    fetch('/api/masters?table=user_profiles&order=full_name').then(r => r.json()).catch(() => {})
    const interval = setInterval(load, 60000) // auto-refresh every 60s
    return () => clearInterval(interval)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⟳</div>
          <div>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const delays = data?.delay_alerts || []
  const byProcess = (data?.by_process || []).filter((p: any) => p.waiting + p.wip + p.qc_pending + p.qc_passed + p.qc_failed + p.rework > 0)
  const wipBuckets = data?.wip_buckets || []
  const stations = (data?.station_constraints || []).filter((s: any) => (s.queue_count || 0) > 0 || (s.active_wip_count || 0) > 0)

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>{greeting} 👋</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{dateStr}</p>
        </div>
        <button onClick={load} style={{ padding: '7px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

      {/* Delay alerts */}
      {delays.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px' }}>⚠</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>{delays.length} project{delays.length > 1 ? 's' : ''} past delivery date</div>
            <div style={{ fontSize: '12px', color: '#dc2626', opacity: 0.8 }}>{delays.map((d: any) => d.project_code).join(', ')}</div>
          </div>
          <button onClick={() => router.push('/projects')} style={{ marginLeft: 'auto', padding: '5px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>View projects</button>
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <KPICard label="Active projects" value={kpis.active_projects || 0} sub="planning / production / QC" color="#1e40af" onClick={() => router.push('/projects')} />
        <KPICard label="WIP now" value={kpis.wip_buckets || 0} sub="buckets actively running" color="#0f766e" onClick={() => router.push('/production')} />
        <KPICard label="Waiting" value={kpis.waiting_buckets || 0} sub="buckets queued" color="#d97706" onClick={() => router.push('/production')} />
        <KPICard label="QC pending" value={(data?.by_process || []).reduce((s: number, p: any) => s + p.qc_pending, 0)} sub="buckets at inspection" color="#7c3aed" onClick={() => router.push('/quality/qc-entry')} />
        <KPICard label="Open NCRs" value={kpis.open_ncrs || 0} sub="non-conformances" color="#dc2626" onClick={() => router.push('/quality/ncr')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Process flow */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Bucket flow by process</h2>
            <button onClick={() => router.push('/production')} style={{ fontSize: '11px', color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Open Kanban →</button>
          </div>
          {byProcess.length === 0 ? (
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No active buckets — <button onClick={() => router.push('/production')} style={{ color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0, fontWeight: '600' }}>create the first bucket</button>
            </div>
          ) : byProcess.map((item: any) => <ProcessFlowBar key={item.process?.id} item={item} />)}
        </div>

        {/* Right column */}
        <div>
          {/* WIP now */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Currently in WIP</h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Live</span>
            </div>
            {wipBuckets.length === 0 ? (
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No buckets in WIP</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {wipBuckets.slice(0, 6).map((b: any) => (
                  <div key={b.id} onClick={() => router.push('/production')} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>{b.bucket_code}</span>
                      <span style={{ fontSize: '12px', color: '#374151', marginLeft: '8px' }}>{b.process_types?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: 'pulse 2s infinite' }} />
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af' }}>{b.hours_in_wip}h</span>
                    </div>
                  </div>
                ))}
                {wipBuckets.length > 6 && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '4px' }}>+{wipBuckets.length - 6} more in WIP</div>
                )}
              </div>
            )}
          </div>

          {/* Station load */}
          {stations.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px' }}>Station load</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stations.map((s: any) => {
                  const qHrs = parseFloat(s.queue_hours || 0)
                  const cap = parseFloat(s.daily_capacity_hrs || 8)
                  const pct = cap > 0 ? Math.min(Math.round((qHrs / cap) * 100), 100) : 0
                  const overloaded = pct > 80
                  return (
                    <div key={s.station_id} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{s.station_name}</span>
                        <span style={{ fontSize: '11px', color: overloaded ? '#dc2626' : '#059669', fontWeight: '600' }}>{pct}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: overloaded ? '#ef4444' : '#10b981', borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '10px', color: '#94a3b8' }}>
                        <span>Queue: <strong style={{ color: '#374151' }}>{s.queue_count}</strong></span>
                        <span>WIP: <strong style={{ color: '#374151' }}>{s.active_wip_count}</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Active projects</h2>
          <button onClick={() => router.push('/projects')} style={{ fontSize: '11px', color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>All projects →</button>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Project', 'Name', 'Status', 'Contract', 'Delivery', 'Days left'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(data?.recent_projects || []).length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No active projects — <button onClick={() => router.push('/projects/new')} style={{ color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}>create one</button>
                </td></tr>
              )}
              {(data?.recent_projects || []).map((p: any) => {
                const cfg = PROJECT_STATUS[p.status] || PROJECT_STATUS.planning
                const daysLeft = p.delivery_date ? Math.ceil((new Date(p.delivery_date).getTime() - Date.now()) / 86400000) : null
                return (
                  <tr key={p.id} onClick={() => router.push(`/projects/${p.id}`)}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{p.project_code}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '11px 14px' }}><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{p.contract_value ? `₹${(p.contract_value / 100000).toFixed(1)}L` : '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>{p.delivery_date ? new Date(p.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {daysLeft !== null ? (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: daysLeft < 0 ? '#dc2626' : daysLeft <= 7 ? '#d97706' : '#059669' }}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                        </span>
                      ) : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
