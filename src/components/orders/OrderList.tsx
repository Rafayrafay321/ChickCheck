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
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-6 p-4 border-b border-border last:border-b-0 items-center">
          {[60, 120, 80, 100, 150].map((w, j) => (
            <div key={j} className="h-4 rounded bg-border animate-pulse" style={{ width: w }} />
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
        emoji="📋"
        title="Koi order nahi hai"
        description="Naya order bananey ke liye upar + Naya Order par click karein"
      />
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-bg border-b border-border">
              {['Order ID', 'Customer', 'Items', 'Total (Rs)', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => {
              const isActionLoading = actionLoading === order.id
              return (
                <tr
                  key={order.id}
                  className={`transition-colors hover:bg-bg/60 ${i < orders.length - 1 ? 'border-b border-border' : ''} ${isActionLoading ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <td className="px-4 py-4 font-semibold text-text-secondary">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-4 font-semibold text-text-primary">
                    {order.customer.name}
                  </td>
                  <td className="px-4 py-4 text-text-secondary text-xs">
                    {order.items.map(item => `${item.quantity}${item.product.unit} ${item.product.name}`).join(', ')}
                  </td>
                  <td className="px-4 py-4 font-bold text-base text-primary">
                    {order.totalAmount.toLocaleString('en-PK')}
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-4 text-text-secondary whitespace-nowrap">
                    {new Date(order.orderDate).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-4">
                    {order.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onDeliver(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-500/15 text-green-600 border border-green-500/30 cursor-pointer hover:bg-green-500/25 transition-colors"
                        >
                          Deliver ✓
                        </button>
                        <button
                          onClick={() => onCancel(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-500/15 text-red-500 border border-red-500/30 cursor-pointer hover:bg-red-500/25 transition-colors"
                        >
                          Cancel ✕
                        </button>
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
