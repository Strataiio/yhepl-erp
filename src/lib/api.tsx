'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function apiGet(table: string, opts: {
  select?: string
  order?: string
  asc?: boolean
  filter?: string
  filter2?: string
  limit?: number
} = {}): Promise<any[]> {
  const params = new URLSearchParams({ table })
  if (opts.select) params.set('select', opts.select)
  if (opts.order) params.set('order', opts.order)
  if (opts.asc !== undefined) params.set('asc', String(opts.asc))
  if (opts.filter) params.set('filter', opts.filter)
  if (opts.filter2) params.set('filter2', opts.filter2)
  if (opts.limit) params.set('limit', String(opts.limit))
  const r = await fetch(`/api/masters?${params}`)
  if (!r.ok) { const t = await r.text(); throw new Error(t) }
  return r.json()
}

export async function apiSave(table: string, payload: any, id?: string): Promise<any> {
  const r = await fetch('/api/masters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, payload, id })
  })
  if (!r.ok) { const t = await r.text(); throw new Error(t) }
  return r.json()
}

export async function apiDelete(table: string, filter_col: string, filter_val: string): Promise<void> {
  const r = await fetch('/api/masters', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, filter_col, filter_val })
  })
  if (!r.ok) { const t = await r.text(); throw new Error(t) }
}

export const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  enquiry:         { bg: '#f1f5f9', color: '#475569' },
  order_confirmed: { bg: '#eff6ff', color: '#1e40af' },
  planning:        { bg: '#fefce8', color: '#854d0e' },
  in_production:   { bg: '#ecfdf5', color: '#065f46' },
  qc_pending:      { bg: '#f5f3ff', color: '#5b21b6' },
  dispatched:      { bg: '#f0fdf4', color: '#14532d' },
  closed:          { bg: '#f9fafb', color: '#6b7280' },
  on_hold:         { bg: '#fef2f2', color: '#991b1b' },
  planned:         { bg: '#f1f5f9', color: '#475569' },
  waiting:         { bg: '#fefce8', color: '#854d0e' },
  wip:             { bg: '#eff6ff', color: '#1e40af' },
  qc_failed:       { bg: '#fef2f2', color: '#991b1b' },
  qc_passed:       { bg: '#f0fdf4', color: '#065f46' },
  rework:          { bg: '#fff7ed', color: '#9a3412' },
}

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: c.bg, color: c.color }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function fmt(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtCurrency(n?: number | null) {
  if (n == null) return '—'
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

export const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '9px 12px', fontSize: '13px', color: '#111827', background: '#f9fafb',
  border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none',
  width: '100%', boxSizing: 'border-box', ...extra
})

export const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: '#6b7280',
  display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em'
}
