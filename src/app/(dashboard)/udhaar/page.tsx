'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { RecordPaymentModal } from '@/components/invoices/RecordPaymentModal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

interface Customer {
  id: string
  name: string
  type: 'RESTAURANT' | 'RETAIL'
  phone: string | null
  address: string | null
  totalUdhaar: number
}

interface Invoice {
  id: string
  orderId: string
  customerId: string
  totalAmount: number
  paidAmount: number
  status: 'UNPAID' | 'PARTIAL' | 'PAID'
}

export default function UdhaarPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Payment modal state
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<{
    id: string
    customerId: string
    customerName: string
    totalAmount: number
    paidAmount: number
  } | null>(null)

  const fetchUdhaarData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getCustomers()
      if (res.success && Array.isArray(res.data)) {
        setCustomers(res.data as Customer[])
      } else {
        setError(res.error || 'Data load nahi hua')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUdhaarData()
  }, [fetchUdhaarData])

  // Filter customers who owe money
  const udhaarCustomers = customers.filter(
    (c) => c.totalUdhaar > 0 && c.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalOutstandingUdhaar = customers.reduce((sum, c) => sum + c.totalUdhaar, 0)

  // Quick Payment handler — fetches customer's oldest unpaid invoice
  async function handleOpenPayment(customer: Customer) {
    try {
      const res = await fetch(`/api/invoices?customerId=${customer.id}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        const unpaidInvoices: Invoice[] = json.data.filter((inv: Invoice) => inv.status !== 'PAID')
        if (unpaidInvoices.length > 0) {
          const oldest = unpaidInvoices[unpaidInvoices.length - 1]
          setPaymentModalInvoice({
            id: oldest.id,
            customerId: customer.id,
            customerName: customer.name,
            totalAmount: oldest.totalAmount,
            paidAmount: oldest.paidAmount,
          })
        } else {
          alert('Is customer ka koi unpaid invoice nahi mila')
        }
      }
    } catch {
      alert('Invoice fetch fail ho gaya')
    }
  }

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
        await fetchUdhaarData()
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
          <h2 className="text-2xl font-bold m-0 text-text-primary">📒 Khata (Udhaar Overview)</h2>
          <p className="text-text-secondary mt-1 text-sm">
            Grahakon ka baki udhaar dekhain aur payment record karein
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-xl bg-card border border-border flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div>
          <span className="text-xs font-medium text-text-secondary">Kul Wusool Talab Udhaar (Total Balance):</span>
          <div className="text-2xl font-bold text-red-500 mt-1">
            Rs {totalOutstandingUdhaar.toLocaleString('en-PK')}
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          Baqiya Grahak: <strong className="text-text-primary">{udhaarCustomers.length}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Grahak name se search..."
          className="w-full max-w-xs px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-bg text-text-primary"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/15 text-red-500 rounded-xl text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      {/* Udhaar Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-text-secondary text-sm">
          Udhaar load ho raha hai...
        </div>
      ) : udhaarCustomers.length === 0 ? (
        <EmptyState
          emoji="🎉"
          title="Sab Chuko Gaya!"
          description="Kisi grahak ka koi udhaar baqaya nahi hai"
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg border-b border-border">
                  {['Grahak Name', 'Qisam', 'Phone', 'Udhaar Baqi (Rs)', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {udhaarCustomers.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-bg/60 transition-colors ${i < udhaarCustomers.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <td className="px-4 py-4 font-semibold text-text-primary">
                      {c.name}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={c.type.toLowerCase() as 'restaurant' | 'retail'} />
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {c.phone || '—'}
                    </td>
                    <td className="px-4 py-4 font-bold text-red-500 text-base">
                      Rs {c.totalUdhaar.toLocaleString('en-PK')}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleOpenPayment(c)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-green-500/15 text-green-600 border border-green-500/30 cursor-pointer hover:bg-green-500/25 transition-colors"
                      >
                        💳 Wasool Karein (Pay)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          invoice={paymentModalInvoice}
          onSubmit={handleRecordPayment}
        />
      )}
    </div>
  )
}
