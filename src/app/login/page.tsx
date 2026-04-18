'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('harish@yhepl.in')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Full page navigation — ensures server reads fresh cookies
    window.location.href = '/dashboard'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
      {/* Left — brand panel */}
      <div style={{
        width: '42%', background: '#0a1628', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-start', padding: '0 56px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '52px', height: '52px', background: '#1e40af', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#60a5fa', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>
            Yogashri Heavy Engineering
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#ffffff', lineHeight: '1.15', margin: '0 0 16px' }}>
            YHEPL<br />ERP System
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: '1.7', maxWidth: '280px', margin: 0 }}>
            Production management, quality control, and procurement — built for heavy fabrication.
          </p>
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Project & Bucket Tracking', 'QC & Weld Management', 'HR & Payroll', 'Store & Procurement'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>Sign in</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>Enter your credentials to access the ERP</p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem' }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.125rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>
                  Email address
                </label>
                <input
                  type="email" required
                  placeholder="harish@yhepl.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ display: 'block', width: '100%', padding: '11px 14px', fontSize: '0.9375rem', color: '#0f172a', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>
                  Password
                </label>
                <input
                  type="password" required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ display: 'block', width: '100%', padding: '11px 14px', fontSize: '0.9375rem', color: '#0f172a', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.8125rem', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ display: 'block', width: '100%', padding: '12px', fontSize: '0.9375rem', fontWeight: '600', color: '#ffffff', background: loading ? '#93c5fd' : '#1e40af', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem' }}>
            Login: harish@yhepl.in / Yhepl@2024
          </p>
        </div>
      </div>
    </div>
  )
}
