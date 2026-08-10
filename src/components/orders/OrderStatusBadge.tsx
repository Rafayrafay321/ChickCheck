'use client'

interface OrderStatusBadgeProps {
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED' | string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  let badgeClasses = 'bg-slate-100 text-slate-700'
  let label = status

  if (status === 'PENDING') {
    badgeClasses = 'bg-amber-50 text-amber-700'
    label = '⏳ PENDING'
  } else if (status === 'DELIVERED') {
    badgeClasses = 'bg-emerald-50 text-emerald-700'
    label = '✓ DELIVERED'
  } else if (status === 'CANCELLED') {
    badgeClasses = 'bg-red-50 text-red-700'
    label = '✕ CANCELLED'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClasses}`}>
      {label}
    </span>
  )
}
