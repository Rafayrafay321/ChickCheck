'use client'

import React, { useState, useEffect } from 'react'
import { useDailyRate } from '@/hooks/useDailyRate'
import type { SupplierPurchaseInput } from '@/shared/types'

interface SupplierPurchaseFormProps {
  onSubmit: (input: SupplierPurchaseInput) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
}

const DEFAULT_SUPPLIERS = ['Asim', 'Majid', 'Farhan', 'Danish']

export function SupplierPurchaseForm({ onSubmit, onCancel }: SupplierPurchaseFormProps) {
  const { dailyRate } = useDailyRate()
  const [selectedSupplier, setSelectedSupplier] = useState<string>('Asim')
  const [customSupplierName, setCustomSupplierName] = useState<string>('')
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false)
  const [supplierList, setSupplierList] = useState<string[]>(DEFAULT_SUPPLIERS)

  const [grossWeight, setGrossWeight] = useState('')
  const [dudWeight, setDudWeight] = useState('0')
  const [customRate, setCustomRate] = useState<string>('')
  const [cashPaid, setCashPaid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Set default custom rate when dailyRate is loaded
  useEffect(() => {
    if (dailyRate?.supplyRate && !customRate) {
      setCustomRate(String(dailyRate.supplyRate))
    }
  }, [dailyRate, customRate])

  // Fetch unique past suppliers from purchases history
  useEffect(() => {
    async function loadPastSuppliers() {
      try {
        const res = await fetch('/api/purchases')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const pastNames = json.data.map((p: { supplierName: string }) => p.supplierName).filter(Boolean)
          const merged = Array.from(new Set([...DEFAULT_SUPPLIERS, ...pastNames]))
          setSupplierList(merged)
          if (merged.length > 0) setSelectedSupplier(merged[0])
        }
      } catch {
        // Fallback to default suppliers
      }
    }
    loadPastSuppliers()
  }, [])

  const gross = parseFloat(grossWeight) || 0
  const dud = parseFloat(dudWeight) || 0
  const netWeight = Math.max(0, gross - dud)
  const ratePerKg = parseFloat(customRate) || dailyRate?.supplyRate || 0
  const totalAmount = netWeight * ratePerKg

  function handleSupplierSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === '__NEW__') {
      setIsCustomMode(true)
      setCustomSupplierName('')
    } else {
      setIsCustomMode(false)
      setSelectedSupplier(val)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const finalSupplierName = isCustomMode ? customSupplierName.trim() : selectedSupplier.trim()

    if (!finalSupplierName) {
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
    if (!ratePerKg || ratePerKg <= 0) {
      setError('Purchasing Rate per kg daalein')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      supplierName: finalSupplierName,
      grossWeight: gross,
      dudWeight: dud,
      ratePerKg,
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
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
          ⚠ {error}
        </div>
      )}

      {!dailyRate && (
        <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          ⚠️ <strong>Aaj Ka Rate Missing Hai!</strong> Pehle top bar par click karke aaj ka Farm Rate set karein.
        </div>
      )}

      {/* Supplier Selection Dropdown & New Supplier Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            Supplier Name (Chuno ya Naya Daalo)
          </label>
          {isCustomMode && (
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="text-xs text-blue-600 font-medium hover:underline bg-transparent border-none cursor-pointer"
            >
              ← Back to Dropdown
            </button>
          )}
        </div>

        {!isCustomMode ? (
          <select
            value={selectedSupplier}
            onChange={handleSupplierSelectChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {supplierList.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
            <option value="__NEW__" className="font-semibold text-blue-600">
              + Naya Supplier Add Karein...
            </option>
          </select>
        ) : (
          <input
            type="text"
            required
            autoFocus
            placeholder="Naye supplier ka naam daalein (e.g. Kamran)..."
            value={customSupplierName}
            onChange={(e) => setCustomSupplierName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        )}
      </div>

      {/* Weights & Custom Purchasing Rate Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Gross Wt (Kg)
          </label>
          <input
            type="number"
            step="0.1"
            required
            placeholder="e.g. 244.5"
            value={grossWeight}
            onChange={(e) => setGrossWeight(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Dud / Loss (Kg)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="0"
            value={dudWeight}
            onChange={(e) => setDudWeight(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Rate/Kg (Rs)
          </label>
          <input
            type="number"
            step="1"
            required
            placeholder={dailyRate ? String(dailyRate.supplyRate) : 'Rate'}
            value={customRate}
            onChange={(e) => setCustomRate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm font-semibold transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Net Weight:</span>
          <strong className="text-slate-900 font-semibold">{netWeight.toFixed(1)} Kg</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Selected Purchasing Rate:</span>
          <span className="text-slate-900 font-semibold">Rs {ratePerKg} / kg</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
          <span className="text-slate-600 font-bold">Total Purchase Amount:</span>
          <strong className="text-emerald-600 text-sm font-bold">Rs {totalAmount.toLocaleString()}</strong>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Cash Paid (Optional)
        </label>
        <input
          type="number"
          step="1"
          placeholder="e.g. 70000"
          value={cashPaid}
          onChange={(e) => setCashPaid(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex gap-3 justify-end mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !dailyRate}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11"
        >
          {submitting ? 'Saving...' : 'Save Purchase'}
        </button>
      </div>
    </form>
  )
}
