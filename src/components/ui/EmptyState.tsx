// ─── EmptyState Component ────────────────────────────────────────
// Shown when a table or list has zero rows. Pure Tailwind CSS.

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  emoji?: string
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm gap-2">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold mb-1">
        -
      </div>
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
