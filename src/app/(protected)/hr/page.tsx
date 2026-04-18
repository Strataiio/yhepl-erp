/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HRPage() {
  const [stats, setStats] = useState({ total_emp: 0, present_today: 0, pending_leave: 0, payroll_pending: false })

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0].slice(0, 7)
    Promise.all([
      fetch('/api/hr/employees').then(r => r.json()),
      fetch('/api/hr/leave').then(r => r.json()),
      fetch('/api/hr/payroll').then(r => r.json()),
    ]).then(([emps, leaves, payrolls]) => {
      setStats({
        total_emp: Array.isArray(emps) ? emps.filter((e: any) => e.is_active).length : 0,
        present_today: 0,
        pending_leave: Array.isArray(leaves) ? leaves.filter((l: any) => l.status === 'pending').length : 0,
        payroll_pending: Array.isArray(payrolls) ? !payrolls.find((p: any) => p.payroll_period === today) : true,
      })
    }).catch(() => {})
  }, [])

  const MODULES = [
    { href: '/hr/employees', label: 'Employees', desc: 'Employee master — onboarding, designations, wage structure, documents', color: '#1e40af' },
    { href: '/hr/attendance', label: 'Attendance', desc: 'Daily attendance entry, OT logging, manual corrections', color: '#0f766e' },
    { href: '/hr/leave', label: 'Leave management', desc: 'Leave applications, approvals, balance tracking', color: '#7c3aed' },
    { href: '/hr/payroll', label: 'Payroll', desc: 'Monthly salary processing — auto-compute from attendance, PF/ESIC, payslips', color: '#b45309' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>HR & Payroll</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Employee management, attendance, leave, and monthly payroll</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Active employees', value: stats.total_emp, color: '#1e40af' },
          { label: 'Present today', value: stats.present_today, color: '#059669' },
          { label: 'Pending leaves', value: stats.pending_leave, color: '#d97706' },
          { label: 'Payroll this month', value: stats.payroll_pending ? 'Not run' : 'Done', color: stats.payroll_pending ? '#dc2626' : '#059669' },
        ].map(k => (
          <div key={k.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: '600' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: k.color }}>{k.value}</div>
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
