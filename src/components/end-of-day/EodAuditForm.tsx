'use client'

import React, { useState } from 'react'
import type { LivePool, ProductItem } from './types'

export interface EodAuditFormProps {
  livePool: LivePool | null
  products: ProductItem[]
  onSubmit: (data: {
    retailCashDrawer: number
    liveClosingKg: number
    audits: Array<{ productId: string; closingKg: number }>
    note?: string
  }) => Promise<void>
  submitting: boolean
  submitError: string | null
  submitSuccess: string | null
}

export function EodAuditForm({
  livePool,
  products,
  onSubmit,
  submitting,
  submitError,
  submitSuccess,
}: EodAuditFormProps) {
  const [liveClosingKg, setLiveClosingKg] = useState('')
  const [cutStock, setCutStock] = useState<Record<string, string>>({})
  const [retailCashDrawer, setRetailCashDrawer] = useState('')
  const [note, setNote] = useState('')

  const expectedRemaining = livePool?.availableWeight ?? 0
  const currentPhysical = parseFloat(liveClosingKg) || 0
  const liveVariance = liveClosingKg !== '' ? currentPhysical - expectedRemaining : null

  function handleCutStockChange(productId: string, val: string) {
    setCutStock((prev) => ({ ...prev, [productId]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const audits = Object.entries(cutStock)
      .filter(([_, val]) => val !== '' && !isNaN(parseFloat(val)))
      .map(([productId, val]) => ({
        productId,
        closingKg: parseFloat(val) || 0,
      }))

    onSubmit({
      retailCashDrawer: parseFloat(retailCashDrawer) || 0,
      liveClosingKg: currentPhysical,
      audits,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 m-0">Day Closing Entry</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Night audit & stock reconciliation</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Audit Mode
        </span>
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-200">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200">
          {submitSuccess}
        </div>
      )}

      {/* 1. Live Chicken Cage Pool */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            1. Zinda Murgi (Cage Pool)
          </span>
          <div className="flex items-center gap-3.5 text-xs">
            <span className="text-slate-500 font-medium">
              Aayi: <strong className="text-slate-900 font-bold text-sm">{((livePool?.openingWeight ?? 0) + (livePool?.purchasesWeight ?? 0)).toFixed(1)} kg</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">
              Biki: <strong className="text-red-600 font-bold text-sm">-{(livePool?.soldWeight ?? 0).toFixed(1)} kg</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700 font-medium">
              Expected: <strong className="text-blue-700 font-extrabold text-sm">{expectedRemaining.toFixed(1)} kg</strong>
            </span>
          </div>
        </div>

        {/* Input & Variance Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
          <div className="sm:col-span-7 flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Asal Wazan (Kg) *:
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder={`e.g. ${expectedRemaining.toFixed(1)}`}
              value={liveClosingKg}
              onChange={(e) => setLiveClosingKg(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden placeholder:font-normal placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div className="sm:col-span-5">
            {liveVariance !== null ? (
              <div
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-2xs ${
                  liveVariance >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}
              >
                <span className="uppercase tracking-wider text-[11px] font-bold">Farq (Variance):</span>
                <strong className="text-base font-extrabold">
                  {liveVariance > 0 ? `+${liveVariance.toFixed(1)}` : liveVariance.toFixed(1)} kg
                </strong>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic text-right hidden sm:block">
                Pinjray ka physical wazan daalein
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Freezer / Ready-Cut Stock */}
      {products.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              2. Bacha Hua Maal (Freezer / Fridge Cuts)
            </span>
            <span className="text-xs text-slate-400 font-medium">Optional (kg)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 truncate mb-1.5" title={p.name}>
                  <span className="truncate">{p.name}</span>
                  <span className="text-[11px] text-slate-400 font-normal shrink-0 ml-1">{p.unit}</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={cutStock[p.id] ?? ''}
                  onChange={(e) => handleCutStockChange(p.id, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Cash Drawer & Note */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            3. Draz Mein Cash (PKR) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              required
              placeholder="e.g. 85000"
              value={retailCashDrawer}
              onChange={(e) => setRetailCashDrawer(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xl font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden placeholder:font-normal placeholder:text-slate-400 shadow-2xs"
            />
            <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">PKR</span>
          </div>
        </div>

        <div className="sm:col-span-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            4. Note (Optional)
          </label>
          <input
            type="text"
            placeholder="Koi khas baat (e.g. Chiller mein rakh diya)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-hidden placeholder:text-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 px-4 text-base font-bold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
      >
        {submitting ? 'Saving Hisaab...' : 'Save Day Closing'}
      </button>
    </form>
  )
}
