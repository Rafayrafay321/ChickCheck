'use client'

import React from 'react'

export interface BatchTotals {
  gross: number
  dud: number
  net: number
  amount: number
  cash: number
}

export interface PurchaseGrandTotalsProps {
  rowCount: number
  totals: BatchTotals
}

export function PurchaseGrandTotals({ rowCount, totals }: PurchaseGrandTotalsProps) {
  const netPayable = Math.max(0, totals.amount - totals.cash)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-3.5 space-y-2 text-xs">
      <div className="flex justify-between items-center font-semibold text-slate-700">
        <span>Kul Delivery Rows: {rowCount}</span>
        <span>
          Kul Saaf Wazan: <strong className="text-slate-900 font-bold text-sm">{totals.net.toFixed(1)} kg</strong>
        </span>
      </div>

      <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold">
        <span className="text-slate-600">Kul Bill (Total Purchases):</span>
        <span className="text-base text-blue-700">Rs {totals.amount.toLocaleString('en-PK')}</span>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Spot Cash Adaiygi:</span>
        <span className="text-emerald-700 font-semibold">Rs {totals.cash.toLocaleString('en-PK')}</span>
      </div>

      <div className="flex justify-between items-center text-xs font-bold">
        <span className="text-slate-700">Kul Baqi Udhaar (Net Payable):</span>
        <span className={netPayable > 0 ? 'text-red-600 font-bold text-sm' : 'text-emerald-600'}>
          Rs {netPayable.toLocaleString('en-PK')}
        </span>
      </div>
    </div>
  )
}
