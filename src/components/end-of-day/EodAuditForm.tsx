'use client'

import React, { useState } from 'react'
import type { LivePool } from './types'

export interface EodAuditFormProps {
  livePool: LivePool | null
  onSubmit: (data: {
    retailCashDrawer: number
    liveClosingKg: number
    note?: string
  }) => Promise<void>
  submitting: boolean
  submitError: string | null
  submitSuccess: string | null
}

export function EodAuditForm({
  livePool,
  onSubmit,
  submitting,
  submitError,
  submitSuccess,
}: EodAuditFormProps) {
  const [liveClosingKg, setLiveClosingKg] = useState('')
  const [retailCashDrawer, setRetailCashDrawer] = useState('')
  const [note, setNote] = useState('')

  const expectedRemaining = livePool?.availableWeight ?? 0
  const currentPhysical = parseFloat(liveClosingKg) || 0
  const liveVariance = liveClosingKg ? currentPhysical - expectedRemaining : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      retailCashDrawer: parseFloat(retailCashDrawer) || 0,
      liveClosingKg: currentPhysical,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 m-0">1. Shared Live Hen Pool Reconciliation
      </h3>

      {submitError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
          {submitSuccess}
        </div>
      )}

      {/* Live Weight Pool Reconciliation Panel */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1 font-medium">
  Opening + Purchases</span>
            <strong className="text-sm text-slate-900">
              {(livePool?.openingWeight ?? 0) + (livePool?.purchasesWeight ?? 0)} kg
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 font-medium">
  Total Sold (All Cuts)</span>
            <strong className="text-sm text-red-600">-{livePool?.soldWeight ?? 0} kg</strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 font-medium">
  Expected Remaining</span>
            <strong className="text-sm text-blue-600">{expectedRemaining} kg</strong>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
  Raat Ko Physical Live Hen Count (Kg)
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder={`e.g. ${expectedRemaining}`}
              value={liveClosingKg}
              onChange={(e) => setLiveClosingKg(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {liveVariance !== null && (
            <div
              className={`p-3 rounded-lg border text-xs font-medium ${
                liveVariance >= 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span>
  Variance / Difference:</span>
              <strong className="block text-base font-bold mt-0.5">
                {liveVariance > 0 ? `+${liveVariance.toFixed(1)}` : liveVariance.toFixed(1)} kg
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Cash Drawer Count */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">2. Retail Cash in Hand (Draz Mein Cash)
        </label>
        <input
          type="number"
          step="1"
          required
          placeholder="e.g. 85000"
          value={retailCashDrawer}
          onChange={(e) => setRetailCashDrawer(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
  Note (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Shabeen bill pending, live pool variance noted..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
      >
        {submitting ? 'Calculating...' : 'Submit End of Day Audit'}
      </button>
    </form>
  )
}
