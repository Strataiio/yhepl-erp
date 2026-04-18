'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, Factory, Package,
  ShieldCheck, Users, Settings2, Wrench,
  BarChart2, ScanLine, Truck, LogOut, ChevronRight
} from 'lucide-react'
import { ROLE_LABELS } from '@/lib/roles'
import type { UserRole } from '@/lib/supabase/types'

const ICON_MAP: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard size={15} />,
  'folder-kanban':    <FolderKanban size={15} />,
  'factory':          <Factory size={15} />,
  'package':          <Package size={15} />,
  'shield-check':     <ShieldCheck size={15} />,
  'users':            <Users size={15} />,
  'settings-2':       <Settings2 size={15} />,
  'bar-chart-2':      <BarChart2 size={15} />,
  'scan-qr-code':     <ScanLine size={15} />,
  'truck':            <Truck size={15} />,
}

interface NavItem { label: string; href: string; icon: string }
interface SidebarProps { navItems: NavItem[]; userRole: UserRole; userName: string; onSignOut: () => void }

const SECTION_LABELS: Record<string, string> = {
  '/dashboard': '',
  '/projects': 'Operations',
  '/production': 'Operations',
  '/store': 'Operations',
  '/quality': 'Operations',
  '/hr': 'Admin',
  '/masters': 'Admin',
  '/reports': 'Admin',
  '/worker': 'Tools',
  '/vendor': 'Tools',
}

export default function Sidebar({ navItems, userRole, userName, onSignOut }: SidebarProps) {
  const pathname = usePathname()

  // Group nav items by section
  const sections: { label: string; items: NavItem[] }[] = []
  let lastSection = ''
  navItems.forEach(item => {
    const section = SECTION_LABELS[item.href] ?? ''
    if (section !== lastSection) {
      sections.push({ label: section, items: [item] })
      lastSection = section
    } else {
      sections[sections.length - 1].items.push(item)
    }
  })

  return (
    <aside style={{
      width: '216px', minHeight: '100vh', background: '#0a1628',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={15} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2 }}>YHEPL ERP</div>
            <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.2, marginTop: '2px' }}>Heavy Engineering</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: '6px' }}>
            {section.label && (
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 4px' }}>
                {section.label}
              </div>
            )}
            {section.items.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) || (item.href !== '/dashboard' && pathname === item.href)
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: '1px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
                    background: active ? 'rgba(30,64,175,0.5)' : 'transparent',
                    color: active ? '#ffffff' : '#64748b',
                    transition: 'all 0.12s',
                    borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
                  }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.color = '#cbd5e1' } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = '#64748b' } }}
                  >
                    <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{ICON_MAP[item.icon]}</span>
                    <span style={{ fontSize: '13px', fontWeight: active ? '600' : '400', flex: 1 }}>{item.label}</span>
                    {active && <ChevronRight size={11} style={{ opacity: 0.5 }} />}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.03)', marginBottom: '4px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#93c5fd', flexShrink: 0 }}>
            {userName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || 'User'}</div>
            <div style={{ fontSize: '10px', color: '#475569' }}>{ROLE_LABELS[userRole] || userRole}</div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#475569', fontSize: '12px', cursor: 'pointer', transition: 'all 0.12s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#475569' }}
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
