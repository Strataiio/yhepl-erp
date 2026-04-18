/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

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

type Assembly = { id: string; code: string; name: string; parent_assembly_id: string | null; assembly_level: number; drawing_number?: string; children?: Assembly[] }
type BomLine  = { id: string; line_number: number; product_type_id: string; description: string; qty: number; uom_id: string; drawing_ref: string; assembly_id?: string; product_types?: any; uom_master?: any }

function AssemblyNode({ node, depth, onAdd, onSelect, selected }: { node: Assembly; depth: number; onAdd: (parentId: string) => void; onSelect: (id: string) => void; selected: string | null }) {
  return (
    <div>
      <div
        onClick={() => onSelect(node.id)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', marginLeft: `${depth * 20}px`, background: selected === node.id ? '#eff6ff' : 'transparent', transition: 'background 0.1s' }}
        onMouseEnter={e => { if (selected !== node.id) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc' }}
        onMouseLeave={e => { if (selected !== node.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: depth === 0 ? '#1e40af' : depth === 1 ? '#0f766e' : '#7c3aed', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{node.code}</span>
          <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '8px' }}>{node.name}</span>
          {node.drawing_number && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>DRW: {node.drawing_number}</span>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAdd(node.id) }}
          style={{ padding: '2px 8px', background: '#f0fdf4', color: '#065f46', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
        >+ Sub</button>
      </div>
      {node.children?.map(child => (
        <AssemblyNode key={child.id} node={child} depth={depth + 1} onAdd={onAdd} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  )
}

function buildTree(assemblies: Assembly[]): Assembly[] {
  const map: Record<string, Assembly> = {}
  assemblies.forEach(a => { map[a.id] = { ...a, children: [] } })
  const roots: Assembly[] = []
  assemblies.forEach(a => {
    if (a.parent_assembly_id && map[a.parent_assembly_id]) {
      map[a.parent_assembly_id].children!.push(map[a.id])
    } else {
      roots.push(map[a.id])
    }
  })
  return roots
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<any>(null)
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [bom, setBom] = useState<BomLine[]>([])
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'assemblies' | 'bom' | 'buckets'>('overview')
  const [selectedAssembly, setSelectedAssembly] = useState<string | null>(null)
  const [showAssemblyForm, setShowAssemblyForm] = useState(false)
  const [parentAssemblyId, setParentAssemblyId] = useState<string | null>(null)
  const [assemblyForm, setAssemblyForm] = useState({ code: '', name: '', drawing_number: '' })
  const [showBomForm, setShowBomForm] = useState(false)
  const [bomForm, setBomForm] = useState({ description: '', qty: '', drawing_ref: '', assembly_id: '' })
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [uoms, setUoms] = useState<any[]>([])
  const [bomProductTypeId, setBomProductTypeId] = useState('')
  const [bomUomId, setBomUomId] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [pRes, aRes, bomRes, bRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/assemblies`),
        fetch(`/api/projects/${id}/bom`),
        fetch(`/api/projects/${id}/buckets`),
      ])
      if (pRes.ok) setProject(await pRes.json())
      if (aRes.ok) setAssemblies(await aRes.json())
      if (bomRes.ok) setBom(await bomRes.json())
      if (bRes.ok) setBuckets(await bRes.json())
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/masters?table=product_types&order=name').then(r => r.json()).then(setProductTypes).catch(() => {})
    fetch('/api/masters?table=uom_master&order=code').then(r => r.json()).then(setUoms).catch(() => {})
  }, [id])

  async function saveAssembly() {
    setSaving(true); setError('')
    try {
      const level = parentAssemblyId ? (assemblies.find(a => a.id === parentAssemblyId)?.assembly_level || 1) + 1 : 1
      const r = await fetch(`/api/projects/${id}/assemblies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assemblyForm, parent_assembly_id: parentAssemblyId, assembly_level: level, drawing_number: assemblyForm.drawing_number || null })
      })
      if (!r.ok) throw new Error(await r.text())
      setShowAssemblyForm(false)
      setAssemblyForm({ code: '', name: '', drawing_number: '' })
      const aRes = await fetch(`/api/projects/${id}/assemblies`)
      if (aRes.ok) setAssemblies(await aRes.json())
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function saveBomLine() {
    setSaving(true); setError('')
    try {
      const nextLine = (bom.length > 0 ? Math.max(...bom.map(b => b.line_number)) : 0) + 1
      const r = await fetch(`/api/projects/${id}/bom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_number: nextLine,
          product_type_id: bomProductTypeId || null,
          description: bomForm.description,
          qty: parseFloat(bomForm.qty) || 0,
          uom_id: bomUomId || null,
          drawing_ref: bomForm.drawing_ref || null,
          assembly_id: bomForm.assembly_id || null,
        })
      })
      if (!r.ok) throw new Error(await r.text())
      setShowBomForm(false)
      setBomForm({ description: '', qty: '', drawing_ref: '', assembly_id: '' })
      setBomProductTypeId(''); setBomUomId('')
      const bomRes = await fetch(`/api/projects/${id}/bom`)
      if (bomRes.ok) setBom(await bomRes.json())
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  async function updateStatus(newStatus: string) {
    setStatusChanging(true)
    try {
      await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      setProject((p: any) => ({ ...p, status: newStatus }))
    } catch (e) { setError(String(e)) }
    setStatusChanging(false)
  }

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontFamily: 'system-ui' }}>Loading project...</div>
  if (!project) return <div style={{ padding: '48px', textAlign: 'center', color: '#dc2626', fontFamily: 'system-ui' }}>Project not found</div>

  const sm = STATUS_META[project.status] || STATUS_META.planning
  const tree = buildTree(assemblies)
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const formatCurrency = (n: number) => n ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—'

  const BUCKET_COLORS: Record<string, string> = { planned: '#f1f5f9', waiting: '#fefce8', wip: '#eff6ff', qc_pending: '#faf5ff', qc_passed: '#f0fdf4', qc_failed: '#fef2f2', rework: '#fff7ed', closed: '#f9fafb' }
  const BUCKET_TEXT: Record<string, string> = { planned: '#475569', waiting: '#854d0e', wip: '#1e40af', qc_pending: '#6b21a8', qc_passed: '#065f46', qc_failed: '#991b1b', rework: '#9a3412', closed: '#9ca3af' }

  const inp = (style: any = {}) => ({ padding: '8px 11px', fontSize: '13px', color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, ...style })
  const lbl = { fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', display: 'block' as const, marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

  const STATUS_FLOW = ['enquiry', 'order_confirmed', 'planning', 'in_production', 'qc_pending', 'dispatched', 'closed']
  const currentIdx = STATUS_FLOW.indexOf(project.status)

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', fontFamily: 'system-ui, sans-serif' }}>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <button onClick={() => router.push('/projects')} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer', marginTop: '4px' }}>← Back</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{project.project_code}</span>
              <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: sm.bg, color: sm.color }}>{sm.label}</span>
            </div>
            <div style={{ fontSize: '15px', color: '#374151', marginBottom: '2px' }}>{project.name}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{project.customers?.name} {project.po_number ? `· PO: ${project.po_number}` : ''}</div>
          </div>
        </div>

        {/* Status advance button */}
        {currentIdx < STATUS_FLOW.length - 1 && (
          <button
            onClick={() => updateStatus(STATUS_FLOW[currentIdx + 1])}
            disabled={statusChanging}
            style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
          >
            {statusChanging ? '...' : `→ Move to ${STATUS_META[STATUS_FLOW[currentIdx + 1]]?.label}`}
          </button>
        )}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Contract value', value: formatCurrency(project.contract_value) },
          { label: 'Delivery date', value: formatDate(project.delivery_date) },
          { label: 'Assemblies', value: assemblies.length },
          { label: 'BOM lines', value: bom.length },
        ].map(k => (
          <div key={k.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{k.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{k.value || '—'}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', gap: '4px' }}>
        {(['overview', 'assemblies', 'bom', 'buckets'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', border: 'none', background: 'none', fontSize: '13px', fontWeight: tab === t ? '700' : '400', color: tab === t ? '#1e40af' : '#6b7280', cursor: 'pointer', borderBottom: tab === t ? '2px solid #1e40af' : '2px solid transparent', textTransform: 'capitalize' as const }}>
            {t} {t === 'assemblies' ? `(${assemblies.length})` : t === 'bom' ? `(${bom.length})` : t === 'buckets' ? `(${buckets.length})` : ''}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '16px' }}>Project info</div>
            {[
              ['Type', project.project_type?.replace(/_/g, ' ') || '—'],
              ['Code', project.applicable_code?.replace(/_/g, ' ') || '—'],
              ['PO number', project.po_number || '—'],
              ['PO date', formatDate(project.po_date)],
              ['Created', formatDate(project.created_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                <span style={{ color: '#6b7280' }}>{k}</span>
                <span style={{ color: '#111827', fontWeight: '500' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '16px' }}>Description</div>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', margin: 0 }}>{project.description || 'No description provided.'}</p>
            <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px' }}>Production summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {Object.entries(buckets.reduce((acc: any, b: any) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc }, {})).map(([status, count]) => (
                <div key={status} style={{ background: BUCKET_COLORS[status] || '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: BUCKET_TEXT[status] || '#374151' }}>{count as number}</div>
                  <div style={{ fontSize: '10px', color: BUCKET_TEXT[status] || '#6b7280', fontWeight: '600', textTransform: 'uppercase' as const }}>{status.replace(/_/g, ' ')}</div>
                </div>
              ))}
              {buckets.length === 0 && <div style={{ gridColumn: '1 / -1', fontSize: '13px', color: '#9ca3af' }}>No buckets created yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Assemblies */}
      {tab === 'assemblies' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Hierarchical assembly tree — click a node to add sub-assemblies</p>
            <button onClick={() => { setParentAssemblyId(null); setAssemblyForm({ code: '', name: '', drawing_number: '' }); setShowAssemblyForm(true) }}
              style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              + Add assembly
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', minHeight: '200px' }}>
            {tree.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No assemblies yet. Add your first assembly above.</div>
            ) : (
              tree.map(node => <AssemblyNode key={node.id} node={node} depth={0} onAdd={pid => { setParentAssemblyId(pid); setAssemblyForm({ code: '', name: '', drawing_number: '' }); setShowAssemblyForm(true) }} onSelect={setSelectedAssembly} selected={selectedAssembly} />)
            )}
          </div>

          {showAssemblyForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '400px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                    {parentAssemblyId ? 'Add sub-assembly' : 'Add assembly'}
                  </h3>
                  <button onClick={() => setShowAssemblyForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                  <div><label style={lbl}>Code</label><input style={inp()} placeholder="SA-01" value={assemblyForm.code} onChange={e => setAssemblyForm(f => ({ ...f, code: e.target.value }))} /></div>
                  <div><label style={lbl}>Name</label><input style={inp()} placeholder="Main Shell" value={assemblyForm.name} onChange={e => setAssemblyForm(f => ({ ...f, name: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: '18px' }}><label style={lbl}>Drawing number</label><input style={inp()} placeholder="DRW-001" value={assemblyForm.drawing_number} onChange={e => setAssemblyForm(f => ({ ...f, drawing_number: e.target.value }))} /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveAssembly} disabled={saving} style={{ flex: 1, padding: '10px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Add assembly'}</button>
                  <button onClick={() => setShowAssemblyForm(false)} style={{ padding: '10px 18px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: BOM */}
      {tab === 'bom' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Bill of materials — all items required for this project</p>
            <button onClick={() => setShowBomForm(true)}
              style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              + Add BOM line
            </button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'Product type', 'Description', 'Qty', 'UOM', 'Drawing', 'Assembly'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {bom.length === 0 && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No BOM lines yet</td></tr>}
                {bom.map(line => (
                  <tr key={line.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>{line.line_number}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>{line.product_types?.name || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#111827' }}>{line.description}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{line.qty}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>{line.uom_master?.code || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{line.drawing_ref || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6b7280' }}>{assemblies.find(a => a.id === line.assembly_id)?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showBomForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '480px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' }}>Add BOM line</h3>
                  <button onClick={() => setShowBomForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div><label style={lbl}>Product type</label><select style={inp()} value={bomProductTypeId} onChange={e => setBomProductTypeId(e.target.value)}><option value="">— Select —</option>{productTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div><label style={lbl}>UOM</label><select style={inp()} value={bomUomId} onChange={e => setBomUomId(e.target.value)}><option value="">— UOM —</option>{uoms.map(u => <option key={u.id} value={u.id}>{u.code}</option>)}</select></div>
                </div>
                <div style={{ marginBottom: '12px' }}><label style={lbl}>Description</label><input style={inp()} placeholder="Dish End 500 OD x 10 THK" value={bomForm.description} onChange={e => setBomForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div><label style={lbl}>Qty</label><input style={inp()} type="number" placeholder="2" value={bomForm.qty} onChange={e => setBomForm(f => ({ ...f, qty: e.target.value }))} /></div>
                  <div><label style={lbl}>Drawing ref</label><input style={inp()} placeholder="DRW-001" value={bomForm.drawing_ref} onChange={e => setBomForm(f => ({ ...f, drawing_ref: e.target.value }))} /></div>
                  <div><label style={lbl}>Assembly</label><select style={inp()} value={bomForm.assembly_id} onChange={e => setBomForm(f => ({ ...f, assembly_id: e.target.value }))}><option value="">— None —</option>{assemblies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button onClick={saveBomLine} disabled={saving} style={{ flex: 1, padding: '10px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Add line'}</button>
                  <button onClick={() => setShowBomForm(false)} style={{ padding: '10px 18px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Buckets */}
      {tab === 'buckets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{buckets.length} production buckets for this project</p>
            <button
              onClick={() => router.push(`/production?project=${id}`)}
              style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              + Create bucket
            </button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Bucket code', 'Process', 'Input', 'Qty', 'Status', 'Station', 'Planned date'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {buckets.length === 0 && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No buckets yet — go to Production to create buckets</td></tr>}
                {buckets.map((b: any) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{b.bucket_code}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>{b.process_types?.name || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#374151' }}>{b.product_types?.name || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{b.input_qty}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: BUCKET_COLORS[b.status] || '#f9fafb', color: BUCKET_TEXT[b.status] || '#374151' }}>{b.status}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#6b7280' }}>{b.process_stations?.name || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#6b7280' }}>{b.planned_start_date ? new Date(b.planned_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
