import type { UserRole } from './supabase/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  md: 'MD / Owner',
  project_manager: 'Project Manager',
  project_planner: 'Project Planner',
  production_planner: 'Production Planner',
  store: 'Store / GRN',
  worker: 'Shop Floor Worker',
  supervisor: 'Supervisor',
  qc_inspector: 'QC Inspector',
  qc_manager: 'QC Manager',
  hr: 'HR / Admin',
  accounts: 'Accounts',
  vendor: 'Vendor',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  md: 'bg-purple-100 text-purple-800',
  project_manager: 'bg-blue-100 text-blue-800',
  project_planner: 'bg-blue-100 text-blue-800',
  production_planner: 'bg-teal-100 text-teal-800',
  store: 'bg-amber-100 text-amber-800',
  worker: 'bg-gray-100 text-gray-700',
  supervisor: 'bg-orange-100 text-orange-800',
  qc_inspector: 'bg-red-100 text-red-800',
  qc_manager: 'bg-red-100 text-red-900',
  hr: 'bg-pink-100 text-pink-800',
  accounts: 'bg-green-100 text-green-800',
  vendor: 'bg-gray-100 text-gray-600',
}

// What each role can access (route prefixes)
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  md: ['/dashboard', '/projects', '/production', '/quality', '/hr', '/accounts', '/masters', '/reports'],
  project_manager: ['/dashboard', '/projects', '/production', '/quality', '/masters', '/reports'],
  project_planner: ['/dashboard', '/projects', '/production', '/masters'],
  production_planner: ['/dashboard', '/production', '/projects'],
  store: ['/dashboard', '/store', '/production'],
  worker: ['/dashboard', '/worker'],
  supervisor: ['/dashboard', '/production', '/hr/attendance', '/worker'],
  qc_inspector: ['/dashboard', '/quality', '/production'],
  qc_manager: ['/dashboard', '/quality', '/masters'],
  hr: ['/dashboard', '/hr', '/masters/employees'],
  accounts: ['/dashboard', '/accounts', '/reports'],
  vendor: ['/dashboard', '/vendor'],
}

export function canAccess(role: UserRole, path: string): boolean {
  const allowed = ROLE_ROUTES[role] || []
  return allowed.some(r => path.startsWith(r))
}

// Nav items per role
export interface NavItem {
  label: string
  href: string
  icon: string
}

export function getNavItems(role: UserRole): NavItem[] {
  const all: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Projects', href: '/projects', icon: 'folder-kanban' },
    { label: 'Production', href: '/production', icon: 'factory' },
    { label: 'Store', href: '/store', icon: 'package' },
    { label: 'Quality', href: '/quality', icon: 'shield-check' },
    { label: 'HR', href: '/hr', icon: 'users' },
    { label: 'Accounts', href: '/accounts', icon: 'indian-rupee' },
    { label: 'Masters', href: '/masters', icon: 'settings-2' },
    { label: 'Reports', href: '/reports', icon: 'bar-chart-2' },
    { label: 'Worker', href: '/worker', icon: 'scan-qr-code' },
    { label: 'Vendor', href: '/vendor', icon: 'truck' },
  ]
  const allowed = ROLE_ROUTES[role] || []
  return all.filter(item =>
    allowed.some(r => item.href.startsWith(r) || r.startsWith(item.href))
  )
}
