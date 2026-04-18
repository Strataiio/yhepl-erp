/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

const DOSSIER_SECTIONS = [
  { key: 'drawings', label: 'Drawings', table: 'drawings' },
  { key: 'mtc', label: 'Material MTCs', table: 'grn' },
  { key: 'weld_logs', label: 'Weld logs', table: 'joint_register' },
  { key: 'ndt', label: 'NDT reports', table: 'ndt_results' },
  { key: 'pwht', label: 'PWHT records', table: 'pwht_records' },
  { key: 'dimensional', label: 'Dimensional inspection', table: 'dimensional_inspections' },
  { key: 'ncr', label: 'NCR register', table: 'ncr' },
  { key: 'pressure_test', label: 'Pressure tests', table: 'pressure_tests' },
]

export default function DossierPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ncrs, setNcrs] = useState<any[]>([])
  const [qcLogs, setQcLogs] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => { setProjects(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  async function selectProject(p: any) {
    setSelectedProject(p)
    const [nr, qr] = await Promise.all([
      fetch(`/api/quality/ncr?project_id=${p.id}`).then(r => r.json()),
      fetch(`/api/quality/qc?project_id=${p.id}`).then(r => r.json()),
    ])
    setNcrs(Array.isArray(nr) ? nr : [])
    setQcLogs(Array.isArray(qr) ? qr : [])
  }

  const completeness = selectedProject ? (() => {
    let done = 0
    if (qcLogs.length > 0) done += 2
    if (ncrs.length === 0 || ncrs.every((n: any) => n.status === 'closed')) done += 2
    return Math.min(Math.round((done / 8) * 100), 100)
  })() : 0

  return (
    <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'system-ui,sans-serif' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Document dossier</h1>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>QC handover package completeness per project</p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Projects</div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Loading...</div>}
            {projects.map(p => (
              <div key={p.id} onClick={() => selectProject(p)}
                style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedProject?.id === p.id ? '#eff6ff' : 'transparent', transition: 'background 0.1s' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>{p.project_code}</div>
                <div style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!selectedProject ? (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Select a project to view dossier status</div>
          ) : (
            <div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{selectedProject.project_code} — {selectedProject.name}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: completeness >= 80 ? '#059669' : completeness >= 50 ? '#d97706' : '#dc2626' }}>{completeness}%</div>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                  <div style={{ height: '100%', background: completeness >= 80 ? '#059669' : completeness >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '4px', width: `${completeness}%`, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Dossier completeness</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>QC inspections</div><div style={{ fontSize: '11px', color: '#6b7280' }}>{qcLogs.length} entries</div></div>
                  <span style={{ fontSize: '18px' }}>{qcLogs.length > 0 ? '✓' : '○'}</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>NCR register</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{ncrs.length} NCRs · {ncrs.filter((n: any) => n.status === 'closed').length} closed</div>
                  </div>
                  <span style={{ fontSize: '18px' }}>{ncrs.length === 0 || ncrs.every((n: any) => n.status === 'closed') ? '✓' : '⚠'}</span>
                </div>
                {DOSSIER_SECTIONS.filter(s => !['drawings','mtc','weld_logs','ndt','pwht','dimensional','ncr','pressure_test'].slice(2).includes(s.key)).map(s => (
                  <div key={s.key} style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{s.label}</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>Manual upload required</div></div>
                    <span style={{ fontSize: '14px', color: '#d1d5db' }}>○</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
