// ─── Badge Component ─────────────────────────────────────────────
// Pure Tailwind soft pill badges for status and type fields.

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

const BADGE_CONFIG: Record<BadgeVariant, { classes: string; defaultLabel: string }> = {
  paid:        { classes: 'bg-emerald-50 text-emerald-700',  defaultLabel: 'PAID' },
  delivered:   { classes: 'bg-emerald-50 text-emerald-700',  defaultLabel: 'DELIVERED' },
  partial:     { classes: 'bg-amber-50 text-amber-700',      defaultLabel: 'PARTIAL' },
  pending:     { classes: 'bg-amber-50 text-amber-700',      defaultLabel: 'PENDING' },
  unpaid:      { classes: 'bg-red-50 text-red-700',          defaultLabel: 'UNPAID' },
  cancelled:   { classes: 'bg-red-50 text-red-700',          defaultLabel: 'CANCELLED' },
  restaurant:  { classes: 'bg-blue-50 text-blue-700',        defaultLabel: 'RESTAURANT' },
  retail:      { classes: 'bg-violet-50 text-violet-700',    defaultLabel: 'RETAIL' },
  active:      { classes: 'bg-emerald-50 text-emerald-700',  defaultLabel: 'ACTIVE' },
  inactive:    { classes: 'bg-slate-100 text-slate-500',     defaultLabel: 'INACTIVE' },
}

export function Badge({ variant, label }: BadgeProps) {
  const config = BADGE_CONFIG[variant]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.classes}`}>
      {label ?? config.defaultLabel}
    </span>
  )
}
