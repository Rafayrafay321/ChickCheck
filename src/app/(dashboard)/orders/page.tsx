'use client'

import { useState, useEffect, useCallback } from 'react'

interface ProductState {
  id: string
  name: string
  nameUrdu: string | null
  unit: string
  pricingType: 'MULTIPLIER' | 'FIXED' | undefined
  defaultMultiplier: number | null
  pricePerUnit: number
  isActive: boolean
}

import { api } from '@/lib/api-client'
import { OrderWithDetails } from './types'
import { OrderList } from '@/components/orders/OrderList'
import { CreateOrderModal } from '@/components/orders/CreateOrderModal'

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string; type: string }[]>([])
  const [products, setProducts] = useState<ProductState[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCustomer, setFilterCustomer] = useState<string>('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ── Fetch Data ──────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const filters = {
      status: filterStatus || undefined,
      customerId: filterCustomer || undefined
    }
    const res = await api.getOrders(filters)
    if (res.success && Array.isArray(res.data)) {
      setOrders(res.data as OrderWithDetails[])
    } else {
      setError(res.error ?? 'Orders load nahi hue')
    }
    setIsLoading(false)
  }, [filterStatus, filterCustomer])

  const fetchDependencies = useCallback(async () => {
    const [cRes, pRes] = await Promise.all([
      api.getCustomers(),
      api.getProducts()
    ])

    if (cRes.success && Array.isArray(cRes.data)) {
      setCustomers(cRes.data)
    }
    if (pRes.success && Array.isArray(pRes.data)) {
      setProducts(pRes.data.filter((p: { isActive: boolean }) => p.isActive).map((p: { id: string; name: string; nameUrdu: string | null; unit: string; pricingType: string; defaultMultiplier: number | null; pricePerUnit: number; isActive: boolean }) => ({
        ...p,
        pricingType: p.pricingType as 'MULTIPLIER' | 'FIXED' | undefined,
      })))
    }
  }, [])

  useEffect(() => {
    fetchDependencies()
  }, [fetchDependencies])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // ── Handlers ────────────────────────────────────────────────────
  async function handleCreateOrder(customerId: string, note: string, items: Array<{ productId: string, quantity: number }>) {
    setFormLoading(true)
    setFormError(null)

    const res = await api.createOrder({ customerId, note, items })
    if (res.success) {
      setIsModalOpen(false)
      fetchOrders()
    } else {
      setFormError(res.error ?? 'Order nahi ban saka')
    }

    setFormLoading(false)
  }

  async function handleDeliver(orderId: string) {
    if (!confirm('Kya waqai ye order deliver ho gaya hai? Is se stock automatically kam ho jayega.')) return

    setActionLoading(orderId)
    const res = await api.updateOrderStatus(orderId, 'DELIVERED')
    if (res.success) {
      fetchOrders()
    } else {
      alert(`Error: ${res.error}`)
    }
    setActionLoading(null)
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Kya waqai ye order CANCEL karna hai?')) return

    setActionLoading(orderId)
    const res = await api.cancelOrder(orderId)
    if (res.success) {
      fetchOrders()
    } else {
      alert(`Error: ${res.error}`)
    }
    setActionLoading(null)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">📋 Orders</h2>
          <p className="text-sm text-slate-500 mt-1">
            Customer orders aur deliveries manage karein
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          + Naya Order
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex gap-3 flex-wrap items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="">Sab Status (All)</option>
          <option value="PENDING">⏳ PENDING</option>
          <option value="DELIVERED">✓ DELIVERED</option>
          <option value="CANCELLED">✕ CANCELLED</option>
        </select>

        <select
          value={filterCustomer}
          onChange={e => setFilterCustomer(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="">Sab Customers (All)</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* Order List Component */}
      <OrderList
        isLoading={isLoading}
        orders={orders}
        onDeliver={handleDeliver}
        onCancel={handleCancel}
        actionLoading={actionLoading}
      />

      {/* Create Modal Component */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customers={customers}
        products={products}
        onSubmit={handleCreateOrder}
        formLoading={formLoading}
        formError={formError}
      />
    </div>
  )
}
