/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

const STATUS_OPTS = [
  { value: 'present', label: 'P — Present', color: '#059669' },
  { value: 'absent', label: 'A — Absent', color: '#dc2626' },
  { value: 'half_day', label: 'H — Half day', color: '#d97706' },
  { value: 'leave', label: 'L — Leave', color: '#7c3aed' },
  { value: 'holiday', label: 'HOL — Holiday', color: '#6b7280' },
  { value: 'week_off', label: 'WO — Week off', color: '#9ca3af' },
]
const STATUS_SHORT: Record<string, { s: string; c: string }> = {
  present: { s: 'P', c: '#059669' }, absent: { s: 'A', c: '#dc2626' },
  half_day: { s: 'H', c: '#d97706' }, leave: { s: 'L', c: '#7c3aed' },
  holiday: { s: 'HOL', c: '#6b7280' }, week_off: { s: 'WO', c: '#9ca3af' },
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export default function AttendancePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const days = daysInMonth(year, month)
  const period = `${year}-${String(month).padStart(2, '0')}`

  async function load() {
    setLoading(true)
    const [er, ar] = await Promise.all([
      fetch('/api/hr/employees').then(r => r.json()),
      fetch(`/api/hr/attendance?month=${period}`).then(r => r.json()),
    ])
    setEmployees(Array.isArray(er) ? er.filter((e: any) => e.is_active) : [])
    setAttendance(Array.isArray(ar) ? ar : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [period])

  function getStatus(empId: string, day: number): string {
    const dateStr = `${period}-${String(day).padStart(2, '0')}`
    const rec = attendance.find(a => a.employee_id === empId && a.attendance_date === dateStr)
    return rec?.status || ''
  }

  function getOT(empId: string, day: number): number {
    const dateStr = `${period}-${String(day).padStart(2, '0')}`
    const rec = attendance.find(a => a.employee_id === empId && a.attendance_date === dateStr)
    return rec?.ot_hours || 0
  }

  async function setStatus(empId: string, day: number, status: string) {
    const dateStr = `${period}-${String(day).padStart(2, '0')}`
    setSaving(`${empId}-${day}`)
    try {
      const r = await fetch('/api/hr/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: empId, attendance_date: dateStr, status, is_manual_entry: true, shift_id: null })
      })
      if (r.ok) {
        const rec = await r.json()
        setAttendance(prev => {
          const filtered = prev.filter(a => !(a.employee_id === empId && a.attendance_date === dateStr))
          return [...filtered, rec]
        })
      }
    } catch {}
    setSaving(null)
  }

  const getMonthSummary = (empId: string) => {
    const empAtt = attendance.filter(a => a.employee_id === empId)
    return {
      P: empAtt.filter(a => a.status === 'present').length,
      A: empAtt.filter(a => a.status === 'absent').length,
      H: empAtt.filter(a => a.status === 'half_day').length,
      L: empAtt.filter(a => a.status === 'leave').length,
      OT: empAtt.reduce((s, a) => s + (a.ot_hours || 0), 0),
    }
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'system-ui,sans-serif', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Attendance register</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={load} style={{ padding: '7px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>↻</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
        {STATUS_OPTS.map(s => (
          <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: s.color + '22', border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: s.color }}>{STATUS_SHORT[s.value]?.s}</div>
            {s.label}
          </div>
        ))}
      </div>

      {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: 'max-content' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: '#374151', position: 'sticky' as const, left: 0, background: '#f9fafb', zIndex: 2, borderRight: '2px solid #e5e7eb', minWidth: '160px' }}>Employee</th>
                {Array.from({ length: days }, (_, i) => {
                  const d = i + 1
                  const dow = new Date(year, month - 1, d).getDay()
                  const isWeekend = dow === 0 || dow === 6
                  return (
                    <th key={d} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: '600', color: isWeekend ? '#9ca3af' : '#374151', minWidth: '32px', background: '#f9fafb' }}>
                      <div>{d}</div>
                      <div style={{ fontSize: '9px', fontWeight: '400' }}>{'SMTWTFS'[dow]}</div>
                    </th>
                  )
                })}
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#374151', minWidth: '40px', background: '#f9fafb' }}>P</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#dc2626', minWidth: '40px', background: '#f9fafb' }}>A</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#d97706', minWidth: '40px', background: '#f9fafb' }}>OT</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const summary = getMonthSummary(emp.id)
                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', position: 'sticky' as const, left: 0, background: '#fff', zIndex: 1, borderRight: '2px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{emp.full_name}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{emp.employee_code} · {emp.departments?.name}</div>
                    </td>
                    {Array.from({ length: days }, (_, i) => {
                      const d = i + 1
                      const status = getStatus(emp.id, d)
                      const ot = getOT(emp.id, d)
                      const key = `${emp.id}-${d}`
                      const isSaving = saving === key
                      const cfg = STATUS_SHORT[status]
                      return (
                        <td key={d} style={{ padding: '4px 2px', textAlign: 'center' }}>
                          <select
                            value={status}
                            onChange={e => setStatus(emp.id, d, e.target.value)}
                            disabled={isSaving}
                            style={{ width: '30px', height: '28px', border: cfg ? `1px solid ${cfg.c}44` : '1px solid #e5e7eb', borderRadius: '4px', background: cfg ? cfg.c + '11' : '#f9fafb', color: cfg ? cfg.c : '#9ca3af', fontSize: '9px', fontWeight: '700', textAlign: 'center' as const, cursor: 'pointer', outline: 'none', padding: 0, appearance: 'none' as const, textAlignLast: 'center' as const }}>
                            <option value="">—</option>
                            {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{STATUS_SHORT[s.value].s}</option>)}
                          </select>
                          {ot > 0 && <div style={{ fontSize: '8px', color: '#1e40af', fontWeight: '600' }}>{ot}h</div>}
                        </td>
                      )
                    })}
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#059669' }}>{summary.P}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#dc2626' }}>{summary.A}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#1e40af' }}>{summary.OT > 0 ? `${summary.OT}h` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
