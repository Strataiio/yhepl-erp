'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('harish@yhepl.in')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Full navigation — server reads fresh cookie on next request
      window.location.replace('/dashboard')
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Left — brand */}
      <div style={{ width: '42%', background: '#0a1628', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '48px', height: '48px', background: '#1e40af', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <p style={{ fontSize: '10px', letterSpacing: '0.16em', color: '#60a5fa', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase' as const }}>Yogashri Heavy Engineering</p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff', lineHeight: 1.1, margin: '0 0 18px' }}>YHEPL<br />ERP</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '260px', margin: '0 0 48px' }}>
            Production, quality, procurement — purpose-built for heavy fabrication.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Projects & Bucket Tracking', 'QC & Weld Management', 'Store & Procurement', 'HR & Payroll'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '360px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>Sign in</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px' }}>Access your ERP dashboard</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email</label>
              <input
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px', color: '#0f172a', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Password</label>
              <input
                type="password" required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px', color: '#0f172a', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: '700', color: '#fff', background: loading ? '#93c5fd' : '#1e40af', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const }}>
            harish@yhepl.in · Yhepl@2024
          </p>
        </div>
      </div>
    </div>
  )
}
