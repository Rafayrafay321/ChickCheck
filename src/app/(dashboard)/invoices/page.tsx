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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold m-0 text-text-primary">🧾 Bill (Invoices)</h2>
          <p className="text-text-secondary mt-1 text-sm">
            Tamaam bills dekhein, customer payments record karein, aur PDF print karein
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap items-center p-4 bg-card border border-border rounded-xl shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Invoice # ya Grahak name se search..."
          className="flex-1 min-w-48 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-bg text-text-primary"
        />

        {(['', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
              statusFilter === st
                ? 'bg-primary border-primary text-white'
                : 'bg-transparent border-border text-text-secondary hover:border-primary/50'
            }`}
          >
            {st === '' ? 'Sab Status' : st}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/15 text-red-500 rounded-xl text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      {/* Invoices Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-text-secondary text-sm">
          Invoices load ho rahe hain...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title="Koi Invoice nahi mila"
          description="Orders page par ja kar naya order deliver ya confirm karein"
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg border-b border-border">
                  {['Invoice ID', 'Customer', 'Items Count', 'Total Bill', 'Paid', 'Balance Due', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const balance = Math.max(0, inv.totalAmount - inv.paidAmount)
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-bg/60 transition-colors ${i < filtered.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <td className="px-4 py-4 font-semibold text-text-secondary whitespace-nowrap">
                        #{inv.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-text-primary">
                        {inv.customer.name}
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        {inv.order?.items?.length || 0} items
                      </td>
                      <td className="px-4 py-4 font-bold text-text-primary">
                        Rs {inv.totalAmount.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4 font-semibold text-green-600">
                        Rs {inv.paidAmount.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4 font-bold text-red-500">
                        Rs {balance.toLocaleString('en-PK')}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={inv.status.toLowerCase() as 'paid' | 'partial' | 'unpaid'} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 whitespace-nowrap">
                          <button
                            onClick={() => setViewModalTarget(inv)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-transparent text-text-secondary hover:bg-bg cursor-pointer transition-colors"
                          >
                            🖨️ Bill Print
                          </button>
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => setPaymentModalTarget(inv)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-500/15 text-green-600 border border-green-500/30 cursor-pointer hover:bg-green-500/25 transition-colors"
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
