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
  const [premiumInput, setPremiumInput] = useState(initialData ? String(initialData.supplierPremium) : '4')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const farmRate = parseFloat(farmRateInput) || 0
  const premium = parseFloat(premiumInput) || 0
  const calculatedSupplyRate = farmRate + premium

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError('')

    if (!farmRate || farmRate <= 0) {
      setError('Farm Rate sahi enter karein (e.g. 300)')
      return
    }

    setSubmitting(true)
    const result = await onSubmit(farmRate, premium)
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Submit fail hua')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/15 text-red-500 text-xs font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Farm Rate (PKR / kg)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          required
          inputMode="numeric"
          placeholder="e.g. 300"
          value={farmRateInput}
          onChange={(e) => setFarmRateInput(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
/>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Supplier Premium (Default: +4 PKR)
        </label>
        <input
          type="number"
          step="1"
          value={premiumInput}
          onChange={(e) => setPremiumInput(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="p-3 rounded-lg bg-bg text-xs flex justify-between items-center border border-border">
        <span className="text-text-secondary">Calculated Supply Rate:</span>
        <strong className="text-green-500 text-sm">
          Rs {calculatedSupplyRate.toFixed(0)} / kg
        </strong>
      </div>

      <div className="flex gap-3 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
      className="w-1/3 py-2.5 px-4 rounded-lg cursor-pointer border border-border bg-transparent text-text-secondary hover:bg-bg transition-colors"
    >
      Cancel
    </button>
  )}
  <button
    type="submit"
    disabled={submitting}
    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11"
  >
    {submitting ? 'Saving...' : 'Save Rate'}
  </button>
</div>
    </form>
  )
}
