'use client'

import { FormField } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductStock, StockHistoryEntry } from '@/app/(dashboard)/stock/types'

interface HistoryTabProps {
  stock: ProductStock[]
  historyProductId: string
  setHistoryProductId: (id: string) => void
  isLoading: boolean
  history: StockHistoryEntry[]
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

export function HistoryTab({ stock, historyProductId, setHistoryProductId, isLoading, history }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <FormField
          label="Maal (Product) Chuno"
          as="select"
          value={historyProductId}
          onChange={(e) => setHistoryProductId(e.target.value)}
        >
          {stock.length === 0 ? <option value="">Koi product nahi hai</option> : null}
          {stock.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''}
            </option>
          ))}
        </FormField>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : history.length === 0 ? (
        <EmptyState
          
          title="Is product ki koi history nahi"
          description="Koi bhi stock IN ya OUT nahi hua"
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Date / Time', 'Type', 'Wazan (Qty)', 'Note'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-slate-500">
                      {new Date(entry.entryDate).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.type === 'IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {entry.type === 'IN' ? '↓ IN' : '↑ OUT'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {entry.quantity} <span className="text-slate-500 font-normal">{entry.product?.unit}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{entry.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
