import React from 'react'

export interface LoadingSkeletonProps {
  rows?: number
  cols?: number
}

export function LoadingSkeleton({ rows = 4, cols = 4 }: LoadingSkeletonProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-100 last:border-b-0 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 rounded bg-slate-200 animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
