import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
          'placeholder:text-gray-400',
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 bg-white hover:border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
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

export function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-700">{label}</label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
          error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
