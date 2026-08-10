'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-medium text-slate-500 animate-pulse">
          Dashboard stats load ho rahe hain...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
        ⚠ {error || 'Data missing'}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header & Touch-Friendly Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">
            Aaj ki bikri, kharcha, murgi aamdan, aur net munafa live summary
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-all active:scale-[0.98] no-underline text-sm"
          >
            + Naya Order
          </Link>
          <Link
            href="/stock"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm font-medium transition-all active:scale-[0.98] no-underline text-sm"
          >
            🚚 Supplier Purchase
          </Link>
          <Link
            href="/expenses"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm font-medium transition-all active:scale-[0.98] no-underline text-sm"
          >
            💸 Kharcha Log
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            💰 Aaj Ki Sales
          </span>
          <div className="text-2xl font-bold text-slate-900">
            Rs {data.todaySales.toLocaleString('en-PK')}
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            🚚 Live Hen Purchases
          </span>
          <div className="text-2xl font-bold text-slate-900">
            Rs {data.todayPurchases.toLocaleString('en-PK')}
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            💸 Daily Expenses
          </span>
          <div className="text-2xl font-bold text-slate-900">
            Rs {data.todayExpenses.toLocaleString('en-PK')}
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            📈 Net Profit Today
          </span>
          <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            Rs {data.netProfit.toLocaleString('en-PK')}
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              📒 Total Udhaar Baqi
            </span>
            <strong className="text-xl font-bold text-slate-900">
              Rs {data.totalUdhaar.toLocaleString('en-PK')}
            </strong>
          </div>
          <Link href="/udhaar" className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline">
            View Khata →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              ⏳ Pending Orders
            </span>
            <strong className="text-xl font-bold text-slate-900">
              {data.pendingOrders} orders
            </strong>
          </div>
          <Link href="/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline">
            View Orders →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              📦 Low Stock Items (&lt;10kg)
            </span>
            <strong className="text-xl font-bold text-slate-900">
              {data.lowStockCount} items
            </strong>
          </div>
          <Link href="/stock" className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline">
            Check Stock →
          </Link>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 m-0">📋 Recent Orders</h3>
            <Link href="/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline">
              All Orders →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-sm text-center">
              <span>📋</span>
              <span className="mt-1 font-medium">Koi order nahi mila.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-900 font-semibold block text-sm">{o.customer.name}</strong>
                    <span className="text-slate-500">#{o.id.slice(-6).toUpperCase()} • {new Date(o.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <strong className="text-slate-900 font-bold text-sm">Rs {o.totalAmount.toLocaleString('en-PK')}</strong>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 m-0">💳 Recent Udhaar Payments</h3>
            <Link href="/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline">
              All Invoices →
            </Link>
          </div>
          {data.recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-sm text-center">
              <span>💳</span>
              <span className="mt-1 font-medium">Koi payment record nahi mila.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-900 font-semibold block text-sm">{p.customer.name}</strong>
                    <span className="text-slate-500">{p.method} • {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <strong className="text-emerald-600 font-bold text-sm">
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
