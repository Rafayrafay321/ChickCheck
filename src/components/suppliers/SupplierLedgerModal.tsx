'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api-client'
import type { Supplier, SupplierLedgerData } from './types'

export interface SupplierLedgerModalProps {
  supplier: Supplier | null
  onClose: () => void
  onRecordPayment: (supplier: Supplier) => void
}

export function SupplierLedgerModal({
  supplier,
  onClose,
  onRecordPayment,
}: SupplierLedgerModalProps) {
  const [data, setData] = useState<SupplierLedgerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supplier) return

    async function loadLedger() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.getSupplierLedger(supplier!.id)
        if (res.success && res.data) {
          setData(res.data as SupplierLedgerData)
        } else {
          setError(res.error || 'Ledger load nahi ho saka')
        }
      } catch {
        setError('Connection error')
      } finally {
        setLoading(false)
      }
    }

    loadLedger()
  }, [supplier])

  if (!supplier) return null

  return (
    <Modal isOpen={!!supplier} onClose={onClose} title={`Supplier Khata (Ledger) — ${supplier.name}`} maxWidth="800px">
      <div className="space-y-5">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Kul Purchases (Total Maal)
            </span>
            <span className="text-base font-bold text-slate-900">Rs {(data?.totalPurchasesAmount ?? 0).toLocaleString('en-PK')}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">Kul Adaiygi (Total Paid)
            </span>
            <span className="text-base font-bold text-emerald-700">Rs {(data?.totalPaymentsAmount ?? 0).toLocaleString('en-PK')}
            </span>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
            <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider block mb-1">Baqi Hisaab (Net Balance)
            </span>
            <span className="text-base font-bold text-red-700">Rs {(data?.calculatedTotalPayable ?? supplier.totalPayable).toLocaleString('en-PK')}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            {supplier.phone ? `Phone: ${supplier.phone}` : ''} {supplier.address ? `| Address: ${supplier.address}` : ''}
          </div>
          <button
            type="button"
            onClick={() => {
              onClose()
              onRecordPayment(supplier)
            }}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            + Nayi Adaiygi (Pay)
          </button>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm animate-pulse">Khata load ho raha hai...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 font-medium">
            {error}
          </div>
        ) : !data || data.entries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 text-sm">Abhi tak is supplier ka koi purchase ya payment record nahi hai.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="max-h-[380px] overflow-y-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider">Date & Type
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider">Tafseel (Description)
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider">Maal Bill (+)
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider">Adaiygi (-)
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-right">Baqi Hisaab
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="font-mono text-slate-700 font-semibold">
                          {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="mt-0.5">
                          {entry.type === 'PURCHASE' ? (
                            <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">Purchase
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">Payment
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-2.5 text-slate-800 font-medium">
                        {entry.description}
                      </td>

                      <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {entry.credit > 0 ? `Rs ${entry.credit.toLocaleString('en-PK')}` : '—'}
                      </td>

                      <td className="px-3.5 py-2.5 font-bold text-emerald-600 whitespace-nowrap">
                        {entry.debit > 0 ? `Rs ${entry.debit.toLocaleString('en-PK')}` : '—'}
                      </td>

                      <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap font-mono text-right">Rs {entry.runningBalance.toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
          >Band Karo (Close)
          </button>
        </div>
      </div>
    </Modal>
  )
}
