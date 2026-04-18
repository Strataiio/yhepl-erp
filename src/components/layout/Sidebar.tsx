'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, Factory, Package,
  ShieldCheck, Users, IndianRupee, Settings2,
  BarChart2, ScanLine, Truck, LogOut, ChevronRight, Wrench
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/roles'
import type { UserRole } from '@/lib/supabase/types'

const ICON_MAP: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard className="w-4 h-4" />,
  'folder-kanban':    <FolderKanban className="w-4 h-4" />,
  'factory':          <Factory className="w-4 h-4" />,
  'package':          <Package className="w-4 h-4" />,
  'shield-check':     <ShieldCheck className="w-4 h-4" />,
  'users':            <Users className="w-4 h-4" />,
  'indian-rupee':     <IndianRupee className="w-4 h-4" />,
  'settings-2':       <Settings2 className="w-4 h-4" />,
  'bar-chart-2':      <BarChart2 className="w-4 h-4" />,
  'scan-qr-code':     <ScanLine className="w-4 h-4" />,
  'truck':            <Truck className="w-4 h-4" />,
}

interface NavItem { label: string; href: string; icon: string }
interface SidebarProps {
  navItems: NavItem[]
  userRole: UserRole
  userName: string
  onSignOut: () => void
}

export default function Sidebar({ navItems, userRole, userName, onSignOut }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside style={{
      width:'220px', minHeight:'100vh', background:'#0a1628',
      display:'flex', flexDirection:'column', flexShrink:0,
      borderRight:'1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Brand */}
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{
            width:'34px', height:'34px', background:'#1e40af', borderRadius:'8px',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
          }}>
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#ffffff', lineHeight:1.2 }}>YHEPL ERP</div>
            <div style={{ fontSize:'10px', color:'#64748b', lineHeight:1.2, marginTop:'2px' }}>Heavy Engineering</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', display:'block', marginBottom:'2px' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'10px',
                padding:'9px 10px', borderRadius:'8px', cursor:'pointer',
                background: active ? '#1e3a8a' : 'transparent',
                color: active ? '#ffffff' : '#94a3b8',
                transition:'all 0.15s'
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.color = '#e2e8f0' }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = '#94a3b8' } }}
              >
                <span style={{ opacity: active ? 1 : 0.7 }}>{ICON_MAP[item.icon]}</span>
                <span style={{ fontSize:'13px', fontWeight: active ? '600' : '400', flex:1 }}>{item.label}</span>
                {active && <ChevronRight style={{ width:'12px', height:'12px', opacity:0.6 }} />}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', marginBottom:'4px' }}>
          <div style={{
            width:'30px', height:'30px', borderRadius:'50%',
            background:'#1e3a8a', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'12px', fontWeight:'700',
            color:'#93c5fd', flexShrink:0
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize:'10px', color:'#475569', marginTop:'1px' }}>
              {ROLE_LABELS[userRole]}
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          style={{
            width:'100%', display:'flex', alignItems:'center', gap:'8px',
            padding:'8px 10px', background:'transparent', border:'none',
            borderRadius:'6px', cursor:'pointer', color:'#64748b',
            fontSize:'12px', transition:'all 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget).style.color = '#f87171'; (e.currentTarget).style.background = 'rgba(248,113,113,0.08)' }}
          onMouseLeave={e => { (e.currentTarget).style.color = '#64748b'; (e.currentTarget).style.background = 'transparent' }}
        >
          <LogOut style={{ width:'14px', height:'14px' }} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
