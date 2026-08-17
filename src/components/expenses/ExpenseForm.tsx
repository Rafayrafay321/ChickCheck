'use client'

import React, { useState } from 'react'
import type { ExpenseInput } from '@/shared/types'

interface ExpenseFormProps {
  onSubmit: (input: ExpenseInput) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
}

const CATEGORIES = [
  { id: 'PETROL', label: 'Petrol', emoji: '⛽' },
  { id: 'BAGS', label: 'Poly Bags', emoji: '🛍️' },
  { id: 'BIKE', label: 'Bike Repair', emoji: '🛵' },
  { id: 'PUNCHER', label: 'Puncher', emoji: '🔧' },
  { id: 'POLICE', label: 'Police/Chungi', emoji: '👮' },
  { id: 'LUNCH', label: 'Lunch/Khaana', emoji: '🍱' },
  { id: 'WAGES', label: 'Wages/Mazdoori', emoji: '💼' },
  { id: 'OTHER', label: 'Other Kharcha', emoji: '📝' },
] as const

export function ExpenseForm({ onSubmit, onCancel }: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseInput['category']>('PETROL')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Amount sahi enter karein (e.g. 500)')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      category,
      amount: numAmount,
      note: note.trim() || undefined,
    })
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Expense save fail hua')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/15 text-red-500 text-xs font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">
          Category Select Karein
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Amount (PKR)
        </label>
        <input
          type="number"
          step="1"
          required
          placeholder="e.g. 500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Note (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Subah ka petrol, bags 2 bundles..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-3 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-lg cursor-pointer border border-border bg-transparent text-text-secondary hover:bg-bg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11"
        >
          {submitting ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </form>
  )
}
