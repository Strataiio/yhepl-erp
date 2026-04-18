/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminDB } from '@/lib/api-helpers'
import AppShell from '@/components/layout/AppShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // 1. Verify session via Supabase auth (uses anon key + cookie — no RLS needed)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch profile using admin client (bypasses RLS — service role key, server only)
  const db = adminDB() as any
  const { data: profile } = await db
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // If no profile yet, create a default one so the user isn't locked out
  if (!profile) {
    await db.from('user_profiles').upsert({
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
