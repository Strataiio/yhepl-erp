/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function QualityPage() {
  const [stats, setStats] = useState({ open_ncr: 0, qc_pending: 0, qc_passed_today: 0, qc_failed_today: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/quality/ncr').then(r => r.json()),
      fetch('/api/quality/qc').then(r => r.json()),
    ]).then(([ncrs, qcs]) => {
      const today = new Date().toISOString().split('T')[0]
      setStats({
        open_ncr: Array.isArray(ncrs) ? ncrs.filter((n: any) => ['open','under_capa'].includes(n.status)).length : 0,
        qc_pending: 0,
        qc_passed_today: Array.isArray(qcs) ? qcs.filter((q: any) => q.result === 'pass' && q.inspected_at?.startsWith(today)).length : 0,
        qc_failed_today: Array.isArray(qcs) ? qcs.filter((q: any) => q.result === 'fail' && q.inspected_at?.startsWith(today)).length : 0,
      })
    }).catch(() => {})
  }, [])

  const MODULES = [
    { href: '/quality/qc-entry', label: 'QC entry', desc: 'Inspect buckets — parameter-level pass/fail against spec. Auto-creates NCR on failure.', color: '#1e40af' },
    { href: '/quality/ncr', label: 'NCR & CAPA', desc: 'Non-conformance reports, corrective actions, CAPA closure tracking', color: '#dc2626' },
    { href: '/quality/weld', label: 'Weld management', desc: 'WPS library, joint register, welder qualification, NDT results per joint', color: '#b45309' },
    { href: '/quality/dossier', label: 'Document dossier', desc: 'Per-project QC handover package completeness tracker', color: '#065f46' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Quality</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>QC inspection, NCR management, and document dossier</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Open NCRs', value: stats.open_ncr, color: '#dc2626', bg: '#fef2f2' },
          { label: 'QC passed today', value: stats.qc_passed_today, color: '#059669', bg: '#f0fdf4' },
          { label: 'QC failed today', value: stats.qc_failed_today, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Pending QC', value: stats.qc_pending, color: '#7c3aed', bg: '#faf5ff' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '10px', padding: '14px 16px', border: `1px solid ${k.color}22` }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: '600' }}>{k.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {MODULES.map(m => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `3px solid ${m.color}`, borderRadius: '10px', padding: '18px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '5px' }}>{m.label}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>{m.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
