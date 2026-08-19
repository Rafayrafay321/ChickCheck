import React from 'react'

export interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 flex items-center justify-between gap-4">
      <div>
        <strong className="font-semibold mr-1">Error:</strong>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="underline cursor-pointer font-bold hover:text-red-800 text-xs shrink-0">Dobara try karo
        </button>
      )}
    </div>
  )
}
