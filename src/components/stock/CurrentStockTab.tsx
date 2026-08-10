'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { ProductStock } from '@/app/(dashboard)/stock/types'

interface CurrentStockTabProps {
  isLoading: boolean
  stock: ProductStock[]
}

function LoadingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-6 p-4 border-b border-border last:border-b-0 items-center">
          {[180, 120, 80, 60].map((w, j) => (
            <div key={j} className="h-4 rounded bg-border animate-pulse" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CurrentStockTab({ isLoading, stock }: CurrentStockTabProps) {
  if (isLoading) return <LoadingSkeleton />

  if (stock.length === 0) {
    return (
      <EmptyState
        emoji="🤔"
        title="Koi product nahi mila"
        description="Pehle Maal (Products) walay page par ja kar naya product banao"
      />
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-bg border-b border-border">
              {['Maal (Product)', 'Urdu Naam', 'Unit', 'Mojooda Stock (Baqi)', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stock.map((p, i) => {
              const isLowStock = p.currentStock < 10
              return (
                <tr key={p.id} className={`hover:bg-bg/60 transition-colors ${i < stock.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-4 py-4 font-semibold text-text-primary">{p.name}</td>
                  <td className="px-4 py-4 text-text-secondary italic">{p.nameUrdu ?? '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${p.unit === 'kg' ? 'bg-green-500/15 text-green-600' : 'bg-blue-500/15 text-blue-600'}`}>
                      {p.unit}
                    </span>
                  </td>
                  <td className={`px-4 py-4 font-bold text-base ${isLowStock ? 'text-red-500' : 'text-green-600'}`}>
                    {p.currentStock.toLocaleString('en-PK')} <span className="text-xs font-normal text-text-secondary">{p.unit}</span>
                  </td>
                  <td className="px-4 py-4">
                    {isLowStock ? (
                      <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-red-500/15 text-red-600">
                        ⚠ LOW STOCK
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-green-500/15 text-green-600">
                        ✓ THEEK HAI
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
