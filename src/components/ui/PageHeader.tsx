import React from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: string
  actionElement?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon = '+',
  actionElement,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {actionElement ? (
        actionElement
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          {actionIcon && <span>{actionIcon}</span>}
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
