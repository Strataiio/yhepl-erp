'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', background: '#0d9488', borderRadius: '14px', marginBottom: '1rem'
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>YHEPL ERP</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Yogashri Heavy Engineering</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff', borderRadius: '16px',
          border: '1px solid #e2e8f0', padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1.5rem' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8125rem', fontWeight: '500',
                color: '#374151', marginBottom: '6px'
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="harish@yhepl.in"
                style={{
                  display: 'block', width: '100%', padding: '10px 14px',
                  fontSize: '0.9375rem', color: '#0f172a',
                  background: '#f8fafc', border: '1.5px solid #cbd5e1',
                  borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8125rem', fontWeight: '500',
                color: '#374151', marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  display: 'block', width: '100%', padding: '10px 14px',
                  fontSize: '0.9375rem', color: '#0f172a',
                  background: '#f8fafc', border: '1.5px solid #cbd5e1',
                  borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.8125rem', color: '#dc2626', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '11px',
                fontSize: '0.9375rem', fontWeight: '600', color: '#ffffff',
                background: loading ? '#5eead4' : '#0d9488',
                border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem' }}>
          Contact HR to set up your account
        </p>
      </div>
    </div>
  )
}
