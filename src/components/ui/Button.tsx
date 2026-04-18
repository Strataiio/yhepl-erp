interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
const STYLES = {
  primary:   { background: '#1e40af', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' },
  danger:    { background: '#dc2626', color: '#fff', border: 'none' },
  ghost:     { background: 'transparent', color: '#374151', border: 'none' },
}
const SIZES = {
  sm: { padding: '5px 12px', fontSize: '12px', borderRadius: '6px' },
  md: { padding: '8px 16px', fontSize: '13px', borderRadius: '8px' },
  lg: { padding: '11px 22px', fontSize: '14px', borderRadius: '8px' },
}
export function Button({ children, variant = 'secondary', size = 'md', loading, disabled, style, ...props }: ButtonProps) {
  return (
    <button
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '600', cursor: disabled || loading ? 'not-allowed' : 'pointer', opacity: disabled || loading ? 0.6 : 1, transition: 'opacity 0.15s', ...STYLES[variant], ...SIZES[size], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span style={{ fontSize: '12px' }}>⟳</span>}
      {children}
    </button>
  )
}
