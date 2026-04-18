/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AppShell from '@/components/layout/AppShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Verify session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile with admin client (bypasses RLS)
  const admin = createAdminClient() as any
  const { data: profile } = await admin
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Auto-create profile if missing
  if (!profile) {
    await admin.from('user_profiles').upsert({
      id: user.id,
      full_name: user.email?.split('@')[0] || 'User',
      role: 'md',
      is_active: true,
    })
  }

  const role = (profile?.role || 'md') as any
  const name = profile?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <AppShell userRole={role} userName={name}>
      {children}
    </AppShell>
  )
}
