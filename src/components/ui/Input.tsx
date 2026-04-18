import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const inputStyle = {
  display: 'block', width: '100%', padding: '9px 12px', fontSize: '13px',
  color: '#111827', background: '#f9fafb', border: '1.5px solid #e5e7eb',
  borderRadius: '7px', outline: 'none', boxSizing: 'border-box' as const,
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>}
      <input ref={ref} style={{ ...inputStyle, borderColor: error ? '#f87171' : '#e5e7eb', ...style }} {...props} />
      {error && <p style={{ fontSize: '11px', color: '#dc2626', margin: 0 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>}
      <select style={{ ...inputStyle, borderColor: error ? '#f87171' : '#e5e7eb' }} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p style={{ fontSize: '11px', color: '#dc2626', margin: 0 }}>{error}</p>}
    </div>
  )
}
