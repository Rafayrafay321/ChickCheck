'use client'

import React, { useState } from 'react'
import { useDailyRate } from '@/hooks/useDailyRate'
import type { SupplierPurchaseInput } from '@/shared/types'

interface SupplierPurchaseFormProps {
  onSubmit: (input: SupplierPurchaseInput) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
}

export function SupplierPurchaseForm({ onSubmit, onCancel }: SupplierPurchaseFormProps) {
  const { dailyRate } = useDailyRate()
  const [supplierName, setSupplierName] = useState('')
  const [grossWeight, setGrossWeight] = useState('')
  const [dudWeight, setDudWeight] = useState('0')
  const [cashPaid, setCashPaid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const gross = parseFloat(grossWeight) || 0
  const dud = parseFloat(dudWeight) || 0
  const netWeight = Math.max(0, gross - dud)
  const ratePerKg = dailyRate?.supplyRate || 0
  const totalAmount = netWeight * ratePerKg

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!supplierName.trim()) {
      setError('Supplier ka naam enter karein')
      return
    }
    if (!gross || gross <= 0) {
      setError('Gross Weight enter karein')
      return
    }
    if (!dailyRate) {
      setError('Pehle aaj ka Farm Rate enter karein!')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      supplierName: supplierName.trim(),
      grossWeight: gross,
      dudWeight: dud,
      cashPaid: parseFloat(cashPaid) || 0,
    })
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Purchase save fail ho gaya')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/15 text-red-500 text-xs font-medium">
          {error}
        </div>
      )}

      {!dailyRate && (
        <div className="p-3 rounded-lg bg-amber-500/15 text-amber-500 text-xs font-medium border border-amber-500/30">
          ⚠️ <strong>Aaj Ka Rate Missing Hai!</strong> Pehle top bar par click karke aaj ka Farm Rate set karein.
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Supplier Name
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Asim / Majid / Farhan / Danish"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Gross Wt (Kg)
          </label>
          <input
            type="number"
            step="0.1"
            required
            placeholder="e.g. 244.5"
            value={grossWeight}
            onChange={(e) => setGrossWeight(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Dud / Dead (Kg)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="0"
            value={dudWeight}
            onChange={(e) => setDudWeight(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="p-3 rounded-lg bg-bg border border-border flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-text-secondary">Net Weight:</span>
          <strong className="text-text-primary">{netWeight.toFixed(1)} Kg</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Supply Rate:</span>
          <span className="text-text-primary">Rs {ratePerKg} / kg</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 mt-1">
          <span className="text-text-secondary font-semibold">Total Purchase:</span>
          <strong className="text-green-500 text-sm">Rs {totalAmount.toLocaleString()}</strong>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Cash Paid (Optional)
        </label>
        <input
          type="number"
          step="1"
          placeholder="e.g. 70000"
          value={cashPaid}
          onChange={(e) => setCashPaid(e.target.value)}
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
          disabled={submitting || !dailyRate}
          className="flex-2 py-2.5 px-4 rounded-lg cursor-pointer border-none bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Purchase'}
        </button>
      </div>
    </form>
  )
}
