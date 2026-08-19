'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { RecordPaymentModal } from '@/components/invoices/RecordPaymentModal'
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { DateFilterBar, getTodayStr } from '@/components/ui/DateFilterBar'
import type { RecordPaymentInput } from '@/shared/types'

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
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters — default to today
  const [filterDate, setFilterDate] = useState<string>(getTodayStr())
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [filterCustomer, setFilterCustomer] = useState<string>('')

  // Modals
  const [paymentModalTarget, setPaymentModalTarget] = useState<Invoice | null>(null)
  const [viewModalTarget, setViewModalTarget] = useState<Invoice | null>(null)

  const fetchDependencies = useCallback(async () => {
    try {
      const res = await api.getCustomers()
      if (res.success && Array.isArray(res.data)) {
        setCustomers(res.data as { id: string; name: string }[])
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchDependencies()
  }, [fetchDependencies])

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getInvoices({
        status: statusFilter || undefined,
        customerId: filterCustomer || undefined,
      })
      if (res.success && Array.isArray(res.data)) {
        setInvoices(res.data as Invoice[])
      } else {
        setInvoices([])
        setError(res.error || 'Invoices load nahi hue')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, filterCustomer])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleRecordPayment = async (data: {
    invoiceId: string
    customerId: string
    amount: number
    method: string
    note?: string
  }) => {
    try {
      const res = await api.recordPayment(data as RecordPaymentInput)
      if (res.success) {
        await fetchInvoices()
        return { success: true }
      } else {
        return { success: false, error: res.error || 'Payment save fail hua' }
      }
    } catch {
      return { success: false, error: 'Connection error' }
    }
  }

  const isToday = filterDate === getTodayStr()
  const isAllDates = !filterDate
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0)
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="Bill (Invoices)"
        subtitle={isToday ? 'Aaj ke tamam bills aur wasooli' : isAllDates ? 'Tamam pichlay bills' : `Bills baraye ${filterDate}`}
      />

      {/* Reusable DateFilterBar */}
      <DateFilterBar
        date={filterDate}
        onDateChange={setFilterDate}
        showReset={!isToday || !!statusFilter || !!filterCustomer}
        onReset={() => {
          setFilterDate(getTodayStr())
          setStatusFilter('')
          setFilterCustomer('')
        }}
        summarySlot={
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
  Total ({invoices.length})
            </span>
            <span className="text-xs font-bold text-slate-900">
  Rs {totalBilled.toLocaleString('en-PK')}{' '}
              <span className="text-emerald-600 font-normal">
                (Paid: Rs {totalPaid.toLocaleString('en-PK')})
              </span>
            </span>
          </div>
        }
      >
        {/* Status Dropdown Slot */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
        >
          <option value="">
  Sab Status</option>
          <option value="UNPAID"> UNPAID</option>
          <option value="PARTIAL"> PARTIAL</option>
          <option value="PAID"> PAID</option>
        </select>

        {/* Customer Dropdown Slot */}
        <select
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer max-w-[160px] truncate"
        >
          <option value="">
  Sab Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </DateFilterBar>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm animate-pulse">
  Bills load ho rahe hain...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          
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
                {invoices.map((inv) => {
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
  Dekho</button>
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => setPaymentModalTarget(inv)}
                              className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white shadow-2xs cursor-pointer"
                            >
  Wasooli</button>
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
