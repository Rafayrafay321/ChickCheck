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

export function HistoryTab({ stock, historyProductId, setHistoryProductId, isLoading, history }: HistoryTabProps) {
  return (
    <div>
      <div className="mb-4 max-w-xs">
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
          emoji="📜"
          title="Is product ki koi history nahi"
          description="Koi bhi stock IN ya OUT nahi hua"
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg border-b border-border">
                  {['Date / Time', 'Type', 'Wazan (Qty)', 'Note'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((entry, i) => (
                  <tr key={entry.id} className={`hover:bg-bg/60 transition-colors ${i < history.length - 1 ? 'border-b border-border' : ''}`}>
                    <td className="px-4 py-4 text-text-secondary">
                      {new Date(entry.entryDate).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${entry.type === 'IN' ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600'}`}>
                        {entry.type === 'IN' ? '↓ IN' : '↑ OUT'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-text-primary">
                      {entry.quantity} <span className="text-text-secondary font-normal">{entry.product?.unit}</span>
                    </td>
                    <td className="px-4 py-4 text-text-secondary">{entry.note || '—'}</td>
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
