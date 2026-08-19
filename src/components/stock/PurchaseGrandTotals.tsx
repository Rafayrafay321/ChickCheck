'use client'

import React from 'react'

export interface BatchTotals {
  gross: number
  amount: number
  cash: number
}

export interface PurchaseGrandTotalsProps {
  rowCount: number
  totals: BatchTotals
}

export function PurchaseGrandTotals({ rowCount, totals }: PurchaseGrandTotalsProps) {
  const udhaar = Math.max(0, totals.amount - totals.cash)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-slate-500">{rowCount} Supplier{rowCount > 1 ? 's' : ''} — <strong className="font-mono text-slate-800">{totals.gross.toFixed(1)} kg</strong></span>
        <span className="font-bold text-slate-900 text-sm font-mono">Rs {totals.amount.toLocaleString('en-PK')}</span>
      </div>

      {totals.cash > 0 && (
        <div className="flex justify-between items-center text-slate-500">
          <span>Cash Diya</span>
          <span className="font-semibold text-emerald-700 font-mono">-Rs {totals.cash.toLocaleString('en-PK')}</span>
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-200 pt-1.5">
        <span className="font-bold text-slate-700">Baqi Udhaar</span>
        <span className={`font-bold text-sm font-mono ${udhaar > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          Rs {udhaar.toLocaleString('en-PK')}
        </span>
      </div>
    </div>
  )
}
