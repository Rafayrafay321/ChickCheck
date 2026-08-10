'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'

interface DashboardData {
  todaySales: number
  todayPurchases: number
  todayExpenses: number
  netProfit: number
  totalUdhaar: number
  pendingOrders: number
  lowStockCount: number
  recentOrders: Array<{
    id: string
    orderDate: string
    totalAmount: number
    status: 'PENDING' | 'DELIVERED' | 'CANCELLED'
    customer: { name: string; type: string }
  }>
  recentPayments: Array<{
    id: string
    amount: number
    method: string
    paidAt: string
    customer: { name: string }
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Dashboard data load nahi hua')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="p-6 text-center text-text-secondary text-sm">
        Dashboard stats load ho rahe hain...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-500/15 text-red-500 rounded-xl text-sm font-medium">
        ⚠ {error || 'Data missing'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold m-0 text-text-primary">🏠 Dashboard Overview</h2>
          <p className="text-text-secondary mt-1 text-sm">
            Aaj ki bikri, kharcha, murgi aamdan, aur net munafa live summary
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/orders"
            className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors no-underline"
          >
            + Naya Order
          </Link>
          <Link
            href="/stock"
            className="px-4 py-2 text-xs font-semibold bg-blue-500/15 text-blue-500 border border-blue-500/30 rounded-lg hover:bg-blue-500/25 transition-colors no-underline"
          >
            🚚 Supplier Purchase
          </Link>
          <Link
            href="/expenses"
            className="px-4 py-2 text-xs font-semibold bg-red-500/15 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/25 transition-colors no-underline"
          >
            💸 Kharcha Log
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-secondary">💰 Aaj Ki Sales:</span>
          <div className="text-2xl font-bold text-primary">
            Rs {data.todaySales.toLocaleString('en-PK')}
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-secondary">🚚 Live Hen Purchases:</span>
          <div className="text-2xl font-bold text-text-primary">
            Rs {data.todayPurchases.toLocaleString('en-PK')}
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-secondary">💸 Daily Expenses:</span>
          <div className="text-2xl font-bold text-red-500">
            Rs {data.todayExpenses.toLocaleString('en-PK')}
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-secondary">📈 Net Profit Today:</span>
          <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Rs {data.netProfit.toLocaleString('en-PK')}
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-text-secondary block">📒 Total Udhaar Baqi:</span>
            <strong className="text-lg text-red-500">Rs {data.totalUdhaar.toLocaleString('en-PK')}</strong>
          </div>
          <Link href="/udhaar" className="text-xs text-primary font-semibold hover:underline">View Khata →</Link>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-text-secondary block">⏳ Pending Orders:</span>
            <strong className="text-lg text-amber-500">{data.pendingOrders} orders</strong>
          </div>
          <Link href="/orders" className="text-xs text-primary font-semibold hover:underline">View Orders →</Link>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-text-secondary block">📦 Low Stock Items (&lt;10kg):</span>
            <strong className="text-lg text-text-primary">{data.lowStockCount} items</strong>
          </div>
          <Link href="/stock" className="text-xs text-primary font-semibold hover:underline">Check Stock →</Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="text-base font-semibold m-0 text-text-primary">📋 Recent Orders</h3>
            <Link href="/orders" className="text-xs text-primary font-semibold hover:underline">All Orders →</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="text-xs text-text-secondary py-4 text-center">Koi order nahi mila.</div>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="p-3 bg-bg rounded-lg border border-border flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-text-primary block">{o.customer.name}</strong>
                    <span className="text-text-secondary">#{o.id.slice(-6).toUpperCase()} • {new Date(o.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <strong className="text-primary text-sm">Rs {o.totalAmount.toLocaleString('en-PK')}</strong>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="text-base font-semibold m-0 text-text-primary">💳 Recent Udhaar Payments</h3>
            <Link href="/invoices" className="text-xs text-primary font-semibold hover:underline">All Invoices →</Link>
          </div>
          {data.recentPayments.length === 0 ? (
            <div className="text-xs text-text-secondary py-4 text-center">Koi payment record nahi mila.</div>
          ) : (
            <div className="space-y-2">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="p-3 bg-bg rounded-lg border border-border flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-text-primary block">{p.customer.name}</strong>
                    <span className="text-text-secondary">{p.method} • {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <strong className="text-green-600 text-sm">
                    + Rs {p.amount.toLocaleString('en-PK')}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
