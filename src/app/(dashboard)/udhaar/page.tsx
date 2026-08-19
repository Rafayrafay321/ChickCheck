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
      const res = await api.getInvoices({ customerId: customer.id })
      if (res.success && Array.isArray(res.data)) {
        const unpaidInvoices: Invoice[] = (res.data as Invoice[]).filter((inv: Invoice) => inv.status !== 'PAID')
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
      const res = await api.recordPayment({
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        amount: data.amount,
        method: data.method as 'CASH' | 'JAZZCASH' | 'EASYPAISA' | 'BANK',
        note: data.note,
      })
      if (res.success) {
        await fetchUdhaarData()
        return { success: true }
      } else {
        return { success: false, error: res.error || 'Payment save fail hua' }
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Khata (Udhaar Overview)</h2>
          <p className="text-sm text-slate-500 mt-1">Grahakon ka baki udhaar dekhain aur payment record karein
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Kul Wusool Talab Udhaar (Total Balance)
          </span>
          <div className="text-2xl font-bold text-red-600">Rs {totalOutstandingUdhaar.toLocaleString('en-PK')}
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500">Baqiya Grahak: <strong className="text-slate-900 font-bold text-sm">{udhaarCustomers.length}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-xs">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Grahak name se search..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Udhaar Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 text-sm">Udhaar load ho raha hai...
        </div>
      ) : udhaarCustomers.length === 0 ? (
        <EmptyState
          
          title="Sab Chuko Gaya!"
          description="Kisi grahak ka koi udhaar baqaya nahi hai"
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Grahak Name', 'Qisam', 'Phone', 'Udhaar Baqi (Rs)', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {udhaarCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={c.type.toLowerCase() as 'restaurant' | 'retail'} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {c.phone || '—'}
                    </td>
                    <td className="px-4 py-4 font-bold text-red-600 text-base">Rs {c.totalUdhaar.toLocaleString('en-PK')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleOpenPayment(c)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-[0.98] cursor-pointer"
                      >Wasool Karein (Pay)
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
