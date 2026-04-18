'use client'

import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { getNavItems } from '@/lib/roles'
import type { UserRole } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface AppShellProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}

export default function AppShell({ children, userRole, userName }: AppShellProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = getNavItems(userRole)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        navItems={navItems}
        userRole={userRole}
        userName={userName}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
