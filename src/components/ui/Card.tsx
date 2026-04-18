interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING = { none: '0', sm: '16px', md: '20px', lg: '24px' }

export function Card({ children, padding = 'md' }: CardProps) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: PADDING[padding] }}>
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>{children}</div>
}

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px' }}>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', fontWeight: '500' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  )
}
