'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { OrderWithDetails } from '@/app/(dashboard)/orders/types'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrderListProps {
  isLoading: boolean
  orders: OrderWithDetails[]
  onDeliver: (orderId: string) => void
  onCancel: (orderId: string) => void
  actionLoading: string | null
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-6 p-4 border-b border-slate-100 last:border-b-0 items-center">
          {[60, 120, 80, 100, 150].map((w, j) => (
            <div key={j} className="h-4 rounded bg-slate-200 animate-pulse" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function OrderList({ isLoading, orders, onDeliver, onCancel, actionLoading }: OrderListProps) {
  if (isLoading) return <LoadingSkeleton />
  if (orders.length === 0) {
    return (
      <EmptyState
        
        title="Koi order nahi hai"
        description="Naya order bananey ke liye upar + Naya Order par click karein"
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Order ID', 'Customer', 'Items', 'Total (Rs)', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const isActionLoading = actionLoading === order.id
              return (
                <tr
                  key={order.id}
                  className={`hover:bg-slate-50/50 transition-colors ${isActionLoading ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <td className="px-4 py-4 font-semibold text-slate-500">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {order.customer.name}
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {order.items.map(item => `${item.quantity}${item.product.unit} ${item.product.name}`).join(', ')}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-900">
  Rs {order.totalAmount.toLocaleString('en-PK')}
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                    {new Date(order.orderDate).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-4">
                    {order.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onDeliver(order.id)}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-[0.98] cursor-pointer"
                        >
  Deliver</button>
                        <button
                          onClick={() => onCancel(order.id)}
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm transition-all hover:bg-red-100 active:scale-[0.98] cursor-pointer"
                        >
  Cancel</button>
                      </div>
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
