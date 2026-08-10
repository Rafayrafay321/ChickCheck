'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { ProductStock } from '@/app/(dashboard)/stock/types'

interface CurrentStockTabProps {
  isLoading: boolean
  stock: ProductStock[]
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-6 p-4 border-b border-slate-100 last:border-b-0 items-center">
          {[180, 120, 80, 60].map((w, j) => (
            <div key={j} className="h-4 rounded bg-slate-200 animate-pulse" style={{ width: w }} />
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Maal (Product)', 'Urdu Naam', 'Unit', 'Mojooda Stock (Baqi)', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stock.map((p) => {
              const isLowStock = p.currentStock < 10
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-4 py-4 text-slate-500 italic">{p.nameUrdu ?? '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${p.unit === 'kg' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                      {p.unit}
                    </span>
                  </td>
                  <td className={`px-4 py-4 font-bold text-base ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                    {p.currentStock.toLocaleString('en-PK')} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                  </td>
                  <td className="px-4 py-4">
                    {isLowStock ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                        ⚠ LOW STOCK
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">
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
