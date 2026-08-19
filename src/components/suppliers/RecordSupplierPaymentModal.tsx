'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import type { Supplier } from './types'

export interface RecordSupplierPaymentModalProps {
  supplier: Supplier | null
  onClose: () => void
  onSubmit: (data: {
    supplierId: string
    amount: number
    method: string
    note?: string
  }) => Promise<{ success: boolean; error?: string }>
}

export function RecordSupplierPaymentModal({
  supplier,
  onClose,
  onSubmit,
}: RecordSupplierPaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'CASH' | 'JAZZCASH' | 'EASYPAISA' | 'BANK'>('CASH')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!supplier) return null

  const parsedAmount = parseFloat(amount) || 0
  const remainingAfterPayment = Math.max(0, supplier.totalPayable - parsedAmount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Raqam sahi daalein')
      return
    }

    setLoading(true)
    setError(null)

    const res = await onSubmit({
      supplierId: supplier!.id,
      amount: parsedAmount,
      method,
      note: note.trim() || undefined,
    })

    setLoading(false)
    if (res.success) {
      onClose()
    } else {
      setError(res.error || 'Payment record fail hua')
    }
  }

  return (
    <Modal isOpen={!!supplier} onClose={onClose} title={` Supplier Ko Adaiygi (${supplier.name})`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Balance Overview Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Kul Baqi Hisaab:</span>
            <span className="font-bold text-red-600 text-sm">Rs {supplier.totalPayable.toLocaleString('en-PK')}
            </span>
          </div>

          {parsedAmount > 0 && (
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Is Payment Ke Baad Baqi:</span>
              <span className="font-bold text-slate-900 text-sm">Rs {remainingAfterPayment.toLocaleString('en-PK')}
              </span>
            </div>
          )}
        </div>

        {/* Quick Fill Buttons */}
        {supplier.totalPayable > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Fill:</span>
            <button
              type="button"
              onClick={() => setAmount(String(supplier.totalPayable))}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer transition-colors"
            >Full Bill (Rs {supplier.totalPayable.toLocaleString('en-PK')})
            </button>
            {supplier.totalPayable > 10000 && (
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(supplier.totalPayable / 2)))}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-md hover:bg-slate-200 cursor-pointer transition-colors"
              >Half (Rs {Math.floor(supplier.totalPayable / 2).toLocaleString('en-PK')})
              </button>
            )}
          </div>
        )}

        <FormField label="Ada Ki Gayi Raqam (Amount Rs)" required>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rs</span>
            <input
              type="number"
              step="1"
              min="1"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 font-bold shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </FormField>

        <FormField label="Tareeqa-e-Adaiygi (Payment Method)" required>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'CASH' | 'JAZZCASH' | 'EASYPAISA' | 'BANK')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="CASH">Cash (Naqad)</option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="EASYPAISA"> EasyPaisa</option>
            <option value="BANK">Bank Transfer</option>
          </select>
        </FormField>

        <FormField label="Wazahat / Note (Optional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Subah ki gari ka partial payment..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </FormField>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >Wapas (Cancel)
          </button>
          <button
            type="submit"
            disabled={loading || parsedAmount <= 0}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11 font-bold"
          >
            {loading ? 'Saving...' : 'Adaiygi Save Karo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
