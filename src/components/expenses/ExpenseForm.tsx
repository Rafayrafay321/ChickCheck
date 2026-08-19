'use client'

import React, { useState } from 'react'
import type { ExpenseInput } from '@/shared/types'

const CATEGORIES = [
  { id: 'PETROL', label: 'Petrol' },
  { id: 'BAGS', label: 'Poly Bags' },
  { id: 'BIKE', label: 'Bike Repair' },
  { id: 'PUNCHER', label: 'Puncher' },
  { id: 'POLICE', label: 'Police/Chungi' },
  { id: 'LUNCH', label: 'Lunch/Khaana' },
  { id: 'WAGES', label: 'Wages/Mazdoori' },
  { id: 'OTHER', label: 'Other' },
] as const

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden'

export interface ExpenseFormProps {
  onSubmit: (input: ExpenseInput) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
}

export function ExpenseForm({ onSubmit, onCancel }: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseInput['category']>('PETROL')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Amount sahi enter karein'); return }

    setSubmitting(true)
    const result = await onSubmit({ category, amount: num, note: note.trim() || undefined })
    setSubmitting(false)
    if (!result.success) setError(result.error || 'Save fail')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{error}</div>
      )}

      {/* Category grid */}
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Category</label>
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`py-2 px-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all text-center ${
                category === cat.id
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount + Note */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount (Rs)</label>
          <input
            type="number"
            step="1"
            required
            placeholder="500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Note (Optional)</label>
          <input
            type="text"
            placeholder="Detail..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer disabled:opacity-50">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
