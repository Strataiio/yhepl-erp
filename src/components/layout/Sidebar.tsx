'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, Factory, Package,
  ShieldCheck, Users, IndianRupee, Settings2,
  BarChart2, ScanLine, Truck, LogOut, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'
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

interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarProps {
  navItems: NavItem[]
  userRole: UserRole
  userName: string
  onSignOut: () => void
}

export default function Sidebar({ navItems, userRole, userName, onSignOut }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-gray-950 text-white shrink-0">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
            <Factory className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">YHEPL ERP</p>
            <p className="text-xs text-gray-400 leading-tight">Heavy Engineering</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              {ICON_MAP[item.icon]}
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-800">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{userName}</p>
            <span className={cn(
              'inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5',
              ROLE_COLORS[userRole]
            )}>
              {ROLE_LABELS[userRole]}
            </span>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400
            hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
