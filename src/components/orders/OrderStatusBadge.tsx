'use client'

interface OrderStatusBadgeProps {
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED' | string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  let bgColor = '#F3F4F6'
  let textColor = '#374151'
  let label = status

  if (status === 'PENDING') {
    bgColor = '#FEF9C3' // Yellow
    textColor = '#A16207'
    label = '⏳ PENDING'
  } else if (status === 'DELIVERED') {
    bgColor = '#DCFCE7' // Green
    textColor = '#166534'
    label = '✓ DELIVERED'
  } else if (status === 'CANCELLED') {
    bgColor = '#FEE2E2' // Red
    textColor = '#991B1B'
    label = '✕ CANCELLED'
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: bgColor,
      color: textColor,
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.05em'
    }}>
      {label}
    </span>
  )
}
