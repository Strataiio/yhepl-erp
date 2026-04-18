/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AppShell from '@/components/layout/AppShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Use admin client to bypass RLS on user_profiles
  let role = 'md'
  let name = 'User'

  try {
    const admin = createAdminClient() as any
    const { data: profile } = await admin
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      role = profile.role || 'md'
      name = profile.full_name || user.email?.split('@')[0] || 'User'
    } else {
      // Create profile if missing
      name = user.email?.split('@')[0] || 'User'
      await admin.from('user_profiles').upsert({
        id: user.id,
        full_name: name,
        role: 'md',
        is_active: true,
      })
    }
  } catch {
    // Fallback — don't crash, just use defaults
    name = user.email?.split('@')[0] || 'User'
  }

  return (
    <AppShell userRole={role as any} userName={name}>
      {children}
    </AppShell>
  )
}
