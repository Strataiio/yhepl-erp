// Shared helpers for client components

export async function apiGet(url: string, params?: Record<string, unknown>) {
  let fullUrl = url.startsWith('/') ? url : `/api/masters?table=${url}`
  if (params) {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)) })
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + q.toString()
  }
  const r = await fetch(fullUrl)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function apiSave(url: string, body: unknown, method = 'POST') {
  const fullUrl = url.startsWith('/') ? url : `/api/${url}`
  const r = await fetch(fullUrl, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export const inp = (style: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '8px 11px', fontSize: '13px', color: '#111827', background: '#f9fafb',
  border: '1.5px solid #e5e7eb', borderRadius: '7px', outline: 'none',
  width: '100%', boxSizing: 'border-box', ...style,
})

export const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block',
  marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em',
}
