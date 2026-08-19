'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { OrderWithDetails } from './types'
import { OrderList } from '@/components/orders/OrderList'
import { CreateOrderModal } from '@/components/orders/CreateOrderModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { DateFilterBar, getTodayStr } from '@/components/ui/DateFilterBar'

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string; type: string }[]>([])
  const [products, setProducts] = useState<ProductState[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterDate, setFilterDate] = useState<string>(getTodayStr())
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
      customerId: filterCustomer || undefined,
      date: filterDate || undefined,
    }
    const res = await api.getOrders(filters)
    if (res.success && Array.isArray(res.data)) {
      setOrders(res.data as OrderWithDetails[])
    } else {
      setError(res.error ?? 'Orders load nahi hue')
    }
    setIsLoading(false)
  }, [filterStatus, filterCustomer, filterDate])

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

  const isToday = filterDate === getTodayStr()
  const isAllDates = !filterDate

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="Orders"
        subtitle={isToday ? 'Aaj ke tamam orders' : isAllDates ? 'Tamam pichlay orders' : `Orders baraye ${filterDate}`}
        actionLabel="Naya Order"
        onAction={() => setIsModalOpen(true)}
      />

      {/* Reusable Clean DateFilterBar with Composition Slots */}
      <DateFilterBar
        date={filterDate}
        onDateChange={setFilterDate}
        showReset={!isToday || !!filterStatus || !!filterCustomer}
        onReset={() => {
          setFilterDate(getTodayStr())
          setFilterStatus('')
          setFilterCustomer('')
        }}
        summarySlot={
          <span className="text-xs text-slate-500 font-medium">Total: <strong className="text-slate-900 font-bold">{orders.length}</strong> orders
          </span>
        }
      >
        {/* Status Dropdown Slot */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
        >
          <option value="">Sab Status</option>
          <option value="PENDING">Pending</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED"> Cancelled</option>
        </select>

        {/* Customer Dropdown Slot */}
        <select
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer max-w-[160px] truncate"
        >
          <option value="">Sab Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </DateFilterBar>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
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
