/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  enquiry:         { label: 'Enquiry',         bg: '#f1f5f9', color: '#475569' },
  order_confirmed: { label: 'Order confirmed', bg: '#eff6ff', color: '#1e40af' },
  planning:        { label: 'Planning',        bg: '#fefce8', color: '#854d0e' },
  in_production:   { label: 'In production',  bg: '#f0fdf4', color: '#065f46' },
  qc_pending:      { label: 'QC pending',      bg: '#faf5ff', color: '#6b21a8' },
  dispatched:      { label: 'Dispatched',      bg: '#ecfdf5', color: '#065f46' },
  closed:          { label: 'Closed',          bg: '#f9fafb', color: '#9ca3af' },
  on_hold:         { label: 'On hold',         bg: '#fef2f2', color: '#991b1b' },
}

const ALL_STATUSES = Object.keys(STATUS_META)

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: m.bg, color: m.color, whiteSpace: 'nowrap' as const }}>
      {m.label}
    </span>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [counts, setCounts] = useState<Record<string, number>>({})

  async function load() {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/projects')
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      setRows(data)
      // count by status
      const c: Record<string, number> = { all: data.length }
      data.forEach((p: any) => { c[p.status] = (c[p.status] || 0) + 1 })
      setCounts(c)
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = rows.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchSearch = !search || r.project_code.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const formatCurrency = (n: number) => n ? `₹${(n / 100000).toFixed(1)}L` : '—'

  const daysLeft = (delivery: string) => {
    if (!delivery) return null
    const diff = Math.ceil((new Date(delivery).getTime() - Date.now()) / 86400000)
    return diff
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Projects</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{counts.all || 0} total projects</p>
        </div>
        <button
          onClick={() => router.push('/projects/new')}
          style={{ padding: '10px 20px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          + New project
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', background: statusFilter === 'all' ? '#0f172a' : '#f1f5f9', color: statusFilter === 'all' ? '#fff' : '#475569' }}
        >
          All {counts.all ? `(${counts.all})` : ''}
        </button>
        {['in_production', 'planning', 'qc_pending', 'order_confirmed', 'on_hold'].map(s => (
          counts[s] ? (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', background: statusFilter === s ? STATUS_META[s].color : STATUS_META[s].bg, color: statusFilter === s ? '#fff' : STATUS_META[s].color }}
            >
              {STATUS_META[s].label} ({counts[s]})
            </button>
          ) : null
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          placeholder="Search by project code or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '320px', padding: '9px 14px', fontSize: '13px', color: '#111827', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Project code', 'Name', 'Customer', 'Status', 'Contract value', 'Delivery', 'Days left', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading projects...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>No projects yet</div>
                  <button onClick={() => router.push('/projects/new')} style={{ padding: '8px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Create your first project
                  </button>
                </td>
              </tr>
            )}
            {filtered.map(row => {
              const dl = daysLeft(row.delivery_date)
              const dlColor = dl === null ? '#9ca3af' : dl < 0 ? '#dc2626' : dl <= 7 ? '#d97706' : '#059669'
              return (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/projects/${row.id}`)}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{row.project_code}</td>
                  <td style={{ padding: '13px 16px', fontSize: '14px', color: '#111827', fontWeight: '500', maxWidth: '220px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{row.name}</div>
                    {row.po_number && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>PO: {row.po_number}</div>}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#374151' }}>{row.customers?.name || '—'}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{formatCurrency(row.contract_value)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#374151' }}>{formatDate(row.delivery_date)}</td>
                  <td style={{ padding: '13px 16px' }}>
                    {dl !== null ? (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: dlColor }}>
                        {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Today' : `${dl}d`}
                      </span>
                    ) : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '18px', color: '#d1d5db' }}>›</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
