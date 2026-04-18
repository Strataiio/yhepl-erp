import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'

const MASTER_GROUPS = [
  {
    group: 'Production setup',
    color: '#1e40af',
    light: '#eff6ff',
    items: [
      { href: '/masters/process-types', label: 'Process types', desc: 'Define processes with custom parameter schemas (Dish Forming, Cutting, Welding...)' },
      { href: '/masters/process-stations', label: 'Process stations', desc: 'Shop floor stations with capacity and shift settings' },
      { href: '/masters/process-routes', label: 'Process routes', desc: 'Fixed, parallel and conditional route templates per product' },
      { href: '/masters/product-types', label: 'Product types', desc: 'Products that transform through buckets — input and output types' },
    ]
  },
  {
    group: 'Materials & inventory',
    color: '#0f766e',
    light: '#f0fdfa',
    items: [
      { href: '/masters/material-grades', label: 'Material grades', desc: 'IS / ASME / EN grades with composition and mechanical property limits' },
      { href: '/masters/uom', label: 'Units of measure', desc: 'kg, nos, mm, sqm — with conversion factors' },
      { href: '/masters/machines', label: 'Machines & assets', desc: 'Machine registry with QR codes, cost/hr, and station links' },
      { href: '/masters/cost-rates', label: 'Cost rates', desc: 'Labour, machine and overhead rates for job costing' },
    ]
  },
  {
    group: 'Quality',
    color: '#7c3aed',
    light: '#f5f3ff',
    items: [
      { href: '/masters/qc-checkpoints', label: 'QC checkpoints', desc: 'Inspection points per process — blocking or advisory' },
    ]
  },
  {
    group: 'Parties',
    color: '#b45309',
    light: '#fffbeb',
    items: [
      { href: '/masters/customers', label: 'Customers', desc: 'Customer master with GSTIN, credit terms, contacts' },
      { href: '/masters/vendors', label: 'Vendors', desc: 'Plate suppliers, service vendors, NDE agencies' },
    ]
  },
]

export default function MastersPage() {
  return (
    <div style={{ padding:'32px', maxWidth:'900px', fontFamily:'system-ui,sans-serif' }}>
      <PageHeader
        title="Masters"
        subtitle="Reference data that drives all transactions — set these up before creating projects or buckets"
      />

      <div style={{ display:'flex', flexDirection:'column', gap:'28px' }}>
        {MASTER_GROUPS.map(group => (
          <div key={group.group}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'3px', height:'18px', background:group.color, borderRadius:'2px' }} />
              <h2 style={{ fontSize:'13px', fontWeight:'600', color:'#374151', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {group.group}
              </h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'10px' }}>
              {group.items.map(item => (
                <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
                  <div style={{
                    background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'12px',
                    padding:'16px 18px', cursor:'pointer', transition:'all 0.15s',
                    borderLeft:`3px solid ${group.color}`
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = group.color
                      el.style.background = group.light
                      el.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = '#e5e7eb'
                      el.style.background = '#ffffff'
                      el.style.transform = 'translateY(0)'
                      el.style.borderLeftColor = group.color
                    }}
                  >
                    <div style={{ fontSize:'14px', fontWeight:'600', color:'#111827', marginBottom:'5px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize:'12px', color:'#6b7280', lineHeight:'1.5' }}>
                      {item.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
