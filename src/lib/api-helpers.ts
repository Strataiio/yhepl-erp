import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export function adminDB() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function requireUser() {
  const s = await createServerClient()
  const { data: { user } } = await s.auth.getUser()
  return user
}

export function unauth() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}
