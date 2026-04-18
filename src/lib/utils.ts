import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount)
}

export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals
  }).format(n)
}

export const BUCKET_STATUS_COLORS: Record<string, string> = {
  planned:    'bg-gray-100 text-gray-700',
  waiting:    'bg-amber-100 text-amber-800',
  wip:        'bg-blue-100 text-blue-800',
  qc_pending: 'bg-purple-100 text-purple-800',
  qc_passed:  'bg-green-100 text-green-800',
  qc_failed:  'bg-red-100 text-red-800',
  rework:     'bg-orange-100 text-orange-800',
  closed:     'bg-gray-100 text-gray-500',
}

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  enquiry:         'bg-gray-100 text-gray-700',
  order_confirmed: 'bg-blue-100 text-blue-800',
  planning:        'bg-amber-100 text-amber-800',
  in_production:   'bg-teal-100 text-teal-800',
  qc_pending:      'bg-purple-100 text-purple-800',
  dispatched:      'bg-green-100 text-green-800',
  closed:          'bg-gray-100 text-gray-500',
  on_hold:         'bg-red-100 text-red-800',
}
