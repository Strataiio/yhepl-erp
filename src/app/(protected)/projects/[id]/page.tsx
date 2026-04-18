/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet, apiSave, StatusBadge, fmt, fmtCurrency } from '@/lib/api'
import Link from 'next/link'

const STATUSES = ['enquiry','order_confirmed','planning','in_production','qc_pending','dispatched','closed','on_hold']

const BUCKET_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  planned:   { bg: '#f1f5f9', color: '#475569' },
  waiting:   { bg: '#fefce8', color: '#854d0e' },
  wip:       { bg: '#eff6ff', color: '#1e40af' },
  qc_pending:{ bg: '#f5f3ff', color: '#5b21b6' },
  qc_passed: { bg: '#f0fdf4', color: '#065f46' },
  qc_failed: { bg: '#fef2f2', color: '#991b1b' },
  rework:    { bg: '#fff7ed', color: '#9a3412' },
  closed:    { bg: '#f9fafb', color: '#6b7280' },
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [assemblies, setAssemblies] = useState<any[]>([])
  const [bom, setBom] = useState<any[]>([])
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview'|'assemblies'|'bom'|'buckets'|'cost'>('overview')
  const [changingStatus, setChangingStatus] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const [proj, asm, bomData, bkts] = await Promise.all([
        apiGet('projects', { select: '*, customers(name,code)', filter: `id=${id}` }).then(d => d[0]),
        apiGet('assemblies', { filter: `project_id=${id}`, order: 'assembly_level', asc: true }),
        apiGet('project_bom', { filter: `project_id=${id}`, order: 'line_number', asc: true, select: '*, product_types(name,code), uom_master(code), assemblies(name)' }),
        apiGet('buckets', { filter: `project_id=${id}`, order: 'created_at', asc: false, select: '*, process_types(name), process_stations(name), product_types!input_product_type_id(name)' }),
      ])
      setProject(proj)
      setAssemblies(asm)
      setBom(bomData)
      setBuckets(bkts)
    } catch(e) { setError(String(e)) }
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  async function changeStatus(newStatus: string) {
    setChangingStatus(true)
    try {
      await apiSave('projects', { status: newStatus }, id)
      setProject((p: any) => ({ ...p, status: newStatus }))
    } catch(e) { setError(String(e)) }
    setChangingStatus(false)
  }

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ fontSize: '14px', color: '#9ca3af' }}>Loading project...</div>
    </div>
  )
  if (!project) return (
    <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Project not found</div>
      <button onClick={() => router.push('/projects')} style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>← Back to projects</button>
    </div>
  )

  const activeBuckets = buckets.filter(b => ['wip','waiting'].includes(b.status)).length
  const completedBuckets = buckets.filter(b => ['qc_passed','closed'].includes(b.status)).length
  const pctComplete = buckets.length > 0 ? Math.round((completedBuckets / buckets.length) * 100) : 0
  const isOverdue = project.delivery_date && new Date(project.delivery_date) < new Date() && !['dispatched','closed'].includes(project.status)

  const TAB = (key: typeof activeTab, label: string, count?: number) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{ padding: '8px 16px', background: activeTab === key ? '#1e40af' : 'transparent', color: activeTab === key ? '#fff' : '#64748b', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: activeTab === key ? '600' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      {label}
      {count !== undefined && <span style={{ background: activeTab === key ? 'rgba(255,255,255,0.25)' : '#f1f5f9', color: activeTab === key ? '#fff' : '#64748b', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '600' }}>{count}</span>}
    </button>
  )

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px' }}>
        <div style={{ maxWidth: '1100px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 0 10px', fontSize: '13px', color: '#64748b' }}>
            <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>Projects</button>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: '500' }}>{project.project_code}</span>
          </div>

          {/* Project header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', background: '#eff6ff', padding: '3px 10px', borderRadius: '20px' }}>{project.project_code}</span>
                <StatusBadge status={project.status} />
                {isOverdue && <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '20px' }}>OVERDUE</span>}
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>{project.name}</h1>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {project.customers?.name}
                {project.project_type && <span style={{ marginLeft: '12px', color: '#94a3b8' }}>· {project.project_type}</span>}
                {project.applicable_code && <span style={{ marginLeft: '12px', color: '#94a3b8' }}>· {project.applicable_code}</span>}
              </div>
            </div>

            {/* Status changer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={project.status}
                onChange={e => changeStatus(e.target.value)}
                disabled={changingStatus}
                style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#374151', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '7px', outline: 'none', cursor: 'pointer' }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <Link href={`/projects/${id}/assemblies`} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '8px 14px', background: '#f8fafc', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '7px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>+ Assembly</button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', paddingBottom: '0' }}>
            {TAB('overview', 'Overview')}
            {TAB('assemblies', 'Assemblies', assemblies.length)}
            {TAB('bom', 'BOM', bom.length)}
            {TAB('buckets', 'Buckets', buckets.length)}
            {TAB('cost', 'Cost')}
          </div>
        </div>
      </div>

      {error && <div style={{ margin: '16px 32px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

      {/* Tab content */}
      <div style={{ padding: '24px 32px', maxWidth: '1100px' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Contract value', value: fmtCurrency(project.contract_value) },
                { label: 'Delivery date', value: fmt(project.delivery_date), alert: isOverdue },
                { label: 'PO number', value: project.po_number || '—' },
                { label: 'Progress', value: `${pctComplete}%`, sub: `${completedBuckets} of ${buckets.length} buckets` },
              ].map(m => (
                <div key={m.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{m.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: (m as any).alert ? '#dc2626' : '#0f172a' }}>{m.value}</div>
                  {(m as any).sub && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{(m as any).sub}</div>}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {buckets.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Production progress</span>
                  <span style={{ color: '#64748b' }}>{completedBuckets} / {buckets.length} buckets completed</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pctComplete}%`, background: pctComplete === 100 ? '#059669' : '#1e40af', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Bucket status breakdown</div>
                {buckets.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>No buckets yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(
                      buckets.reduce((acc: any, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc }, {})
                    ).map(([status, count]) => {
                      const c = BUCKET_STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569' }
                      return (
                        <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: c.bg, color: c.color, fontWeight: '600' }}>{status.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>{String(count)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Project info</div>
                {[
                  ['PO date', fmt(project.po_date)],
                  ['Code / standard', project.applicable_code || '—'],
                  ['Assemblies', assemblies.length],
                  ['BOM lines', bom.length],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f9fafb', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{k}</span>
                    <span style={{ fontWeight: '500', color: '#374151' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ASSEMBLIES */}
        {activeTab === 'assemblies' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <Link href={`/projects/${id}/assemblies`} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Add assembly</button>
              </Link>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Code','Name','Level','Drawing','Route'].map(h => <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {assemblies.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No assemblies yet — add your first assembly or sub-assembly</td></tr>
                  )}
                  {assemblies.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', paddingLeft: `${16 + (a.assembly_level - 1) * 20}px`, fontSize: '13px', fontWeight: '600', color: '#1e40af' }}>
                        {a.assembly_level > 1 && <span style={{ color: '#d1d5db', marginRight: '6px' }}>{'└─'}</span>}
                        {a.code}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>{a.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: a.assembly_level === 1 ? '#eff6ff' : '#f5f3ff', color: a.assembly_level === 1 ? '#1e40af' : '#5b21b6', fontWeight: '600' }}>
                          {a.assembly_level === 1 ? 'Assembly' : a.assembly_level === 2 ? 'Sub-assembly' : 'Component'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{a.drawing_number || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{a.process_route_id ? '✓ Assigned' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOM */}
        {activeTab === 'bom' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <Link href={`/projects/${id}/bom`} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Add BOM line</button>
              </Link>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['#','Product','Assembly','Qty','UOM','Drawing ref'].map(h => <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {bom.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No BOM lines yet — add products required for this project</td></tr>
                  )}
                  {bom.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>{b.line_number}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{b.product_types?.name || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{b.product_types?.code}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{b.assemblies?.name || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{b.qty}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{b.uom_master?.code || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{b.drawing_ref || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BUCKETS */}
        {activeTab === 'buckets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{activeBuckets} active · {completedBuckets} completed</div>
              <Link href="/production" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Create bucket</button>
              </Link>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Bucket','Input product','Process','Station','Status','Qty in/out','Date'].map(h => <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {buckets.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No buckets yet — production planner creates buckets in the Production module</td></tr>
                  )}
                  {buckets.map(b => {
                    const c = BUCKET_STATUS_COLORS[b.status] || { bg: '#f1f5f9', color: '#475569' }
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{b.bucket_code}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{b.product_types?.name || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{b.process_types?.name || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{b.process_stations?.name || '—'}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: c.bg, color: c.color, fontWeight: '600' }}>{b.status}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{b.input_qty} → {b.actual_output_qty ?? '?'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#9ca3af' }}>{fmt(b.planned_start_date)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COST */}
        {activeTab === 'cost' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '20px' }}>Cost summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Contract value', value: fmtCurrency(project.contract_value), color: '#0f172a' },
                { label: 'Planned cost (budget)', value: '—', color: '#374151' },
                { label: 'Actual cost (ledger)', value: '—', color: '#374151' },
              ].map(m => (
                <div key={m.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', fontSize: '13px', color: '#1e40af' }}>
              Cost ledger will populate automatically as buckets run and material is issued. Set up project budget in the next step.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
