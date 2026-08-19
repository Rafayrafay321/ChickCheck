'use client'

import React, { useState } from 'react'
import type { DailyRateData } from '@/hooks/useDailyRate'

interface DailyRateFormProps {
  initialData?: DailyRateData | null
  onSubmit: (farmRate: number, supplierPremium: number) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
}

export function DailyRateForm({ initialData, onSubmit, onCancel }: DailyRateFormProps) {
  const [farmRateInput, setFarmRateInput] = useState(initialData ? String(initialData.farmRate) : '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const farmRate = parseFloat(farmRateInput) || 0
  const standardPremium = initialData?.supplierPremium ?? 4
  const calculatedSupplyRate = farmRate > 0 ? farmRate + standardPremium : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!farmRate || farmRate <= 0) {
      setError('Farm Rate enter karein (e.g. 300)')
      return
    }

    setSubmitting(true)
    const result = await onSubmit(farmRate, standardPremium)
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Submit fail hua')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
  Aaj Ka Daily Farm Rate (Mandi Rate)
        </label>
        <div className="relative">
          <input
            type="number"
            step="1"
            min="1"
            required
            autoFocus
            inputMode="numeric"
            placeholder="e.g. 300"
            value={farmRateInput}
            onChange={(e) => setFarmRateInput(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
  PKR / Kg
          </span>
        </div>
      </div>

      {farmRate > 0 && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">
  Standard Customer Supply Rate:</span>
            <strong className="text-sm font-bold text-emerald-600">
  Rs {calculatedSupplyRate} / kg
            </strong>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
  Cancel</button>
        )}
        <button
          type="submit"
          disabled={submitting || !farmRate}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11 flex-1"
        >
          {submitting ? 'Saving...' : 'Save Daily Rate'}
        </button>
      </div>
    </form>
  )
}
