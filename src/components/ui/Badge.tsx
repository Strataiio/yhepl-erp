interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}
const COLORS = {
  default: { bg: '#f1f5f9', color: '#475569' },
  success: { bg: '#f0fdf4', color: '#065f46' },
  warning: { bg: '#fefce8', color: '#854d0e' },
  danger:  { bg: '#fef2f2', color: '#991b1b' },
  info:    { bg: '#eff6ff', color: '#1e40af' },
  neutral: { bg: '#f9fafb', color: '#6b7280' },
}
export function Badge({ children, variant = 'default' }: BadgeProps) {
  const c = COLORS[variant]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: c.bg, color: c.color }}>
      {children}
    </span>
  )
}
