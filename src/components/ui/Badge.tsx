// ─── Badge Component ─────────────────────────────────────────────
// Renders a color-coded pill badge for status and type fields.

type BadgeVariant =
  | 'paid'
  | 'delivered'
  | 'partial'
  | 'pending'
  | 'unpaid'
  | 'cancelled'
  | 'restaurant'
  | 'retail'
  | 'active'
  | 'inactive'

interface BadgeProps {
  variant: BadgeVariant
  label?: string
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; defaultLabel: string }> = {
  paid:        { bg: '#DCFCE7', color: '#166534', defaultLabel: 'PAID' },
  delivered:   { bg: '#DCFCE7', color: '#166534', defaultLabel: 'DELIVERED' },
  partial:     { bg: '#FEF9C3', color: '#854D0E', defaultLabel: 'PARTIAL' },
  pending:     { bg: '#FEF9C3', color: '#854D0E', defaultLabel: 'PENDING' },
  unpaid:      { bg: '#FEE2E2', color: '#991B1B', defaultLabel: 'UNPAID' },
  cancelled:   { bg: '#FEE2E2', color: '#991B1B', defaultLabel: 'CANCELLED' },
  restaurant:  { bg: '#DBEAFE', color: '#1E40AF', defaultLabel: 'RESTAURANT' },
  retail:      { bg: '#EDE9FE', color: '#5B21B6', defaultLabel: 'RETAIL' },
  active:      { bg: '#DCFCE7', color: '#166534', defaultLabel: 'ACTIVE' },
  inactive:    { bg: '#F3F4F6', color: '#6B7280', defaultLabel: 'INACTIVE' },
}

export function Badge({ variant, label }: BadgeProps) {
  const style = BADGE_STYLES[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: '9999px',
      fontSize: '0.7rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      backgroundColor: style.bg, color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {label ?? style.defaultLabel}
    </span>
  )
}
