// ─── EmptyState Component ────────────────────────────────────────
// Shown when a table or list has zero rows. Pure Tailwind CSS.

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ emoji = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm gap-3">
      <span className="text-4xl">{emoji}</span>
      <h3 className="text-base font-semibold text-slate-900 m-0">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 m-0 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
