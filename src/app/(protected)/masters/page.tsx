'use client'
import Link from 'next/link'

const MASTER_GROUPS = [
  {
    group: 'Production setup',
    color: '#1e40af',
    bg: '#eff6ff',
    items: [
      { href: '/masters/process-types', label: 'Process types', desc: 'Define processes and custom parameter fields — Dish End Forming, Cutting, Welding' },
      { href: '/masters/process-stations', label: 'Process stations', desc: 'Shop floor stations with capacity and shift settings' },
      { href: '/masters/process-routes', label: 'Process routes', desc: 'Fixed, parallel and conditional route templates per product' },
      { href: '/masters/product-types', label: 'Product types', desc: 'Products that transform through buckets — blanks, dish ends, assemblies' },
    ]
  },
  {
    group: 'Materials & inventory',
    color: '#0f766e',
    bg: '#f0fdfa',
    items: [
      { href: '/masters/material-grades', label: 'Material grades', desc: 'IS / ASME / EN grades with composition and mechanical property limits' },
      { href: '/masters/uom', label: 'Units of measure', desc: 'kg, nos, mm, sqm — with conversion factors' },
      { href: '/masters/machines', label: 'Machines & assets', desc: 'Machine registry with QR codes, cost/hr and station links' },
      { href: '/masters/cost-rates', label: 'Cost rates', desc: 'Labour, machine and overhead rates for job costing' },
    ]
  },
  {
    group: 'Quality',
    color: '#7c3aed',
    bg: '#f5f3ff',
    items: [
      { href: '/masters/qc-checkpoints', label: 'QC checkpoints', desc: 'Inspection gates per process — blocking or advisory' },
    ]
  },
  {
    group: 'Parties',
    color: '#b45309',
    bg: '#fffbeb',
    items: [
      { href: '/masters/customers', label: 'Customers', desc: 'Customer master with GSTIN, credit terms and contacts' },
      { href: '/masters/vendors', label: 'Vendors', desc: 'Plate suppliers, service vendors and NDE agencies' },
    ]
  },
]

function MasterCard({ href, label, desc, color, bg }: { href: string; label: string; desc: string; color: string; bg: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#ffffff',
        border: `1px solid #e5e7eb`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '10px',
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.background = bg
          el.style.borderColor = color
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.background = '#ffffff'
          el.style.borderColor = '#e5e7eb'
          el.style.borderLeftColor = color
          el.style.transform = 'translateY(0)'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '5px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>{desc}</div>
      </div>
    </Link>
  )
}

export default function MastersPage() {
  return (
    <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>Masters</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Reference data that drives all transactions — set these up before creating projects or buckets
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {MASTER_GROUPS.map(group => (
          <div key={group.group}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '3px', height: '16px', background: group.color, borderRadius: '2px' }} />
              <h2 style={{ fontSize: '11px', fontWeight: '700', color: '#374151', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {group.group}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {group.items.map(item => (
                <MasterCard key={item.href} {...item} color={group.color} bg={group.bg} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
