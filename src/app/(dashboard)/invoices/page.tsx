'use client'

import { useState, useEffect, useCallback } from 'react'
import { RecordPaymentModal } from '@/components/invoices/RecordPaymentModal'
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

interface Invoice {
  id: string
  orderId: string
  customerId: string
  totalAmount: number
  paidAmount: number
  status: 'UNPAID' | 'PARTIAL' | 'PAID'
  createdAt: string
  customer: {
    name: string
    type: string
    phone: string | null
    address: string | null
  }
  order: {
    items: Array<{
      id: string
      quantity: number
      unitPrice: number
      total: number
      product: { name: string; unit: string }
    }>
    note: string | null
  }
}

function getTodayStr() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters — default to today
  const [filterDate, setFilterDate] = useState<string>(getTodayStr())
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  // Modals
  const [paymentModalTarget, setPaymentModalTarget] = useState<Invoice | null>(null)
  const [viewModalTarget, setViewModalTarget] = useState<Invoice | null>(null)

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const query = new URLSearchParams()
      if (statusFilter) query.set('status', statusFilter)
      if (filterDate) query.set('date', filterDate)

      const res = await fetch(`/api/invoices?${query.toString()}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setInvoices(json.data)
      } else {
        setInvoices([])
        setError(json.error || 'Invoices load nahi hue')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, filterDate])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const filtered = invoices.filter(
    (inv) =>
      inv.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase())
  )

  const handleRecordPayment = async (data: {
    invoiceId: string
    customerId: string
    amount: number
    method: string
    note?: string
  }) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        await fetchInvoices()
        return { success: true }
      } else {
        return { success: false, error: json.error || 'Payment save fail hua' }
      }
    } catch {
      return { success: false, error: 'Connection error' }
    }
  }

  const todayStr = getTodayStr()
  const isToday = filterDate === todayStr
  const isAllDates = !filterDate
  const totalBilled = filtered.reduce((s, i) => s + i.totalAmount, 0)
  const totalPaid = filtered.reduce((s, i) => s + i.paidAmount, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">🧾 Bill (Invoices)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isToday ? 'Aaj ke tamam bills aur wasooli' : isAllDates ? 'Tamam pichlay bills' : `Bills baraye ${filterDate}`}
          </p>
        </div>
      </div>

      {/* Clean Streamlined Filters & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Toggle Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={() => setFilterDate(todayStr)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isToday
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aaj (Today)
            </button>
            <button
              type="button"
              onClick={() => setFilterDate('')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isAllDates
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tamam (All)
            </button>
          </div>

          {/* Custom Date Picker */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
          />

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
          >
            <option value="">Sab Status</option>
            <option value="UNPAID">🔴 UNPAID</option>
            <option value="PARTIAL">🟡 PARTIAL</option>
            <option value="PAID">🟢 PAID</option>
          </select>

          {/* Search Box */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search customer / #"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden min-w-[160px]"
          />
        </div>

        {/* Counter Badge & Reset */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total ({filtered.length})
            </span>
            <span className="text-xs font-bold text-slate-900">
              Rs {totalBilled.toLocaleString('en-PK')}{' '}
              <span className="text-emerald-600 font-normal">
                (Paid: Rs {totalPaid.toLocaleString('en-PK')})
              </span>
            </span>
          </div>
          {(!isToday || statusFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setFilterDate(todayStr)
                setStatusFilter('')
                setSearch('')
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm animate-pulse">
          Bills load ho rahe hain...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          ⚠ {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title="Koi Bill Nahi Mila"
          description={
            isToday
              ? 'Aaj abhi tak koi bill create nahi hua.'
              : 'Is date ya filter par koi bill record nahi mila.'
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Invoice #', 'Customer', 'Date / Time', 'Total Raqam', 'Wasool (Paid)', 'Baqi (Balance)', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const balance = inv.totalAmount - inv.paidAmount
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-slate-900 text-xs">
                        #{inv.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {inv.customer.name}
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {new Date(inv.createdAt).toLocaleDateString()}{' '}
                        <span className="text-slate-400 font-mono">
                          {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                        Rs {inv.totalAmount.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-600 text-sm">
                        Rs {inv.paidAmount.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4 font-bold text-sm">
                        <span className={balance > 0 ? 'text-red-600' : 'text-slate-400'}>
                          Rs {balance.toLocaleString('en-PK')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={inv.status.toLowerCase() as 'unpaid' | 'partial' | 'paid'} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewModalTarget(inv)}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                          >
                            👁 Dekho
                          </button>
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => setPaymentModalTarget(inv)}
                              className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white shadow-2xs cursor-pointer"
                            >
                              💳 Wasooli
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {viewModalTarget && (
        <InvoiceViewModal
          isOpen={!!viewModalTarget}
          onClose={() => setViewModalTarget(null)}
          invoice={viewModalTarget}
        />
      )}

      {paymentModalTarget && (
        <RecordPaymentModal
          isOpen={!!paymentModalTarget}
          onClose={() => setPaymentModalTarget(null)}
          invoice={{
            id: paymentModalTarget.id,
            customerId: paymentModalTarget.customerId,
            customerName: paymentModalTarget.customer.name,
            totalAmount: paymentModalTarget.totalAmount,
            paidAmount: paymentModalTarget.paidAmount,
          }}
          onSubmit={handleRecordPayment}
        />
      )}
    </div>
  )
}
