'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'

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

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Amount sahi enter karein')
      return
    }
    if (numAmount > remaining) {
      setError(`Payment amount baki balance (Rs ${remaining}) se zyada nahi ho sakti`)
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: numAmount,
      method,
      note: note.trim() || undefined,
    })
    setSubmitting(false)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Payment save fail hua')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💳 Payment Record Karein">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-red-500/15 text-red-500 rounded-lg text-xs font-medium">
            ⚠ {error}
          </div>
        )}

        <div className="p-3.5 bg-bg rounded-lg border border-border flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Customer:</span>
            <strong className="text-text-primary">{invoice.customerName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Total Bill:</span>
            <span>Rs {invoice.totalAmount.toLocaleString('en-PK')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Pehle Se Paid:</span>
            <span className="text-green-600">Rs {invoice.paidAmount.toLocaleString('en-PK')}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 mt-1">
            <span className="font-semibold text-text-primary">Baki Dena Hai:</span>
            <strong className="text-red-500 text-sm">Rs {remaining.toLocaleString('en-PK')}</strong>
          </div>
        </div>

        <FormField
          label="Wasool Shuda Amount (PKR)"
          required
          type="number"
          min="1"
          max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <FormField
          as="select"
          label="Payment Method"
          required
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="CASH">💵 CASH</option>
          <option value="JAZZCASH">📱 JazzCash</option>
          <option value="EASYPAISA">📱 EasyPaisa</option>
          <option value="BANK">🏦 Bank Transfer</option>
        </FormField>

        <FormField
          label="Note (Optional)"
          type="text"
          placeholder="e.g. Received by Asghar..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex gap-3 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="py-2.5 px-4 rounded-lg border border-border bg-transparent text-text-secondary hover:bg-bg cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11"
          >
            {submitting ? 'Saving...' : 'Payment Save Karein'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
