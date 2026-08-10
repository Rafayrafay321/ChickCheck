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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
  }, [statusFilter])

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
    amount: number;
    method: string;
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">🧾 Bill (Invoices)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tamaam bills dekhein, customer payments record karein, aur PDF print karein
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Invoice # ya Grahak name se search..."
          className="flex-1 min-w-48 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        {(['', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
              statusFilter === st
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {st === '' ? 'Sab Status' : st}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* Invoices Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 text-sm">
          Invoices load ho rahe hain...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title="Koi Invoice nahi mila"
          description="Orders page par ja kar naya order deliver ya confirm karein"
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Invoice ID', 'Customer', 'Items Count', 'Total Bill', 'Paid', 'Balance Due', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const balance = Math.max(0, inv.totalAmount - inv.paidAmount)
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-500 whitespace-nowrap">
                        #{inv.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {inv.customer.name}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {inv.order?.items?.length || 0} items
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        Rs {inv.totalAmount.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-600">
                        Rs {inv.paidAmount.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4 font-bold text-red-600">
                        Rs {balance.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={inv.status.toLowerCase() as 'paid' | 'partial' | 'unpaid'} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex gap-2 justify-end whitespace-nowrap">
                          <button
                            onClick={() => setViewModalTarget(inv)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                          >
                            🖨️ Bill Print
                          </button>
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => setPaymentModalTarget(inv)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-[0.98] cursor-pointer"
                            >
                              💳 Wasool (Pay)
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

      {/* Record Payment Modal */}
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

      {/* Invoice View & Print Modal */}
      {viewModalTarget && (
        <InvoiceViewModal
          isOpen={!!viewModalTarget}
          onClose={() => setViewModalTarget(null)}
          invoice={viewModalTarget}
        />
      )}
    </div>
  )
}
