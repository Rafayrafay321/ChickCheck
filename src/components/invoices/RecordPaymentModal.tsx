'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: {
    id: string
    customerId: string
    customerName: string
    totalAmount: number
    paidAmount: number
  } | null
  onSubmit: (data: { invoiceId: string; customerId: string; amount: number; method: string; note?: string }) => Promise<{ success: boolean; error?: string }>
}

export function RecordPaymentModal({ isOpen, onClose, invoice, onSubmit }: RecordPaymentModalProps) {
  const remaining = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 0
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && invoice) {
      setAmount(String(remaining))
      setMethod('CASH')
      setNote('')
      setError(null)
    }
  }, [isOpen, invoice, remaining])

  if (!invoice) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice) return
    setError(null)
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Amount daalo'); return }
    if (num > remaining) { setError(`Rs ${remaining} se zyada nahi`); return }

    setSubmitting(true)
    const result = await onSubmit({ invoiceId: invoice.id, customerId: invoice.customerId, amount: num, method, note: note.trim() || undefined })
    setSubmitting(false)
    if (result.success) { onClose() } else { setError(result.error || 'Save fail') }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Record">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{error}</div>
        )}

        {/* Invoice summary */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer</span>
            <strong className="text-slate-900">{invoice.customerName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bill</span>
            <span>Rs {invoice.totalAmount.toLocaleString('en-PK')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Paid</span>
            <span className="text-emerald-600">Rs {invoice.paidAmount.toLocaleString('en-PK')}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1">
            <span className="font-bold text-slate-700">Baqi</span>
            <strong className="text-red-600">Rs {remaining.toLocaleString('en-PK')}</strong>
          </div>
        </div>

        {/* Amount + Method */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount (Rs)</label>
            <input type="number" min="1" max={remaining} required value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${INPUT_CLASS} cursor-pointer`}>
              <option value="CASH">Cash</option>
              <option value="JAZZCASH">JazzCash</option>
              <option value="EASYPAISA">EasyPaisa</option>
              <option value="BANK">Bank</option>
            </select>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Note (Optional)</label>
          <input type="text" placeholder="Detail..." value={note} onChange={(e) => setNote(e.target.value)} className={INPUT_CLASS} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
