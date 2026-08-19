'use client'

import React from 'react'

export interface SupplierOption {
  id: string
  name: string
  ratePremium: number
}

export interface PurchaseRowState {
  key: string
  supplierId: string
  supplierName: string
  grossWeight: string
  ratePerKg: string
  cashPaid: string
}

export interface RowCalculation {
  gross: number
  rate: number
  amount: number
  cash: number
}

export interface PurchaseRowItemProps {
  index: number
  row: PurchaseRowState
  calc: RowCalculation
  suppliers: SupplierOption[]
  canRemove: boolean
  onSupplierChange: (index: number, supplierId: string) => void
  onFieldChange: (index: number, field: keyof PurchaseRowState, value: string) => void
  onRemove: (index: number) => void
}

function formatPremium(val: number): string {
  if (val > 0) return `+Rs ${val}/kg`
  if (val < 0) return `-Rs ${Math.abs(val)}/kg discount`
  return 'Farm Rate'
}

export function PurchaseRowItem({
  index,
  row,
  calc,
  suppliers,
  canRemove,
  onSupplierChange,
  onFieldChange,
  onRemove,
}: PurchaseRowItemProps) {
  const remaining = Math.max(0, calc.amount - calc.cash)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      {/* Supplier select + remove */}
      <div className="flex items-center gap-2">
        <select
          value={row.supplierId}
          onChange={(e) => onSupplierChange(index, e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden cursor-pointer"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({formatPremium(s.ratePremium)})
            </option>
          ))}
        </select>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-2.5 rounded-lg cursor-pointer transition-colors"
          >
            Hatao
          </button>
        )}
      </div>

      {/* 3 clean inputs in a row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Wazan (Kg)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            required
            inputMode="decimal"
            placeholder="244"
            value={row.grossWeight}
            onChange={(e) => onFieldChange(index, 'grossWeight', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Rate/Kg</label>
          <input
            type="number"
            step="1"
            min="1"
            required
            inputMode="numeric"
            placeholder="304"
            value={row.ratePerKg}
            onChange={(e) => onFieldChange(index, 'ratePerKg', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Cash Diya</label>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            placeholder="0"
            value={row.cashPaid}
            onChange={(e) => onFieldChange(index, 'cashPaid', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Inline summary — only when there's data */}
      {calc.gross > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Bill: <strong className="text-slate-900 font-mono font-bold">Rs {calc.amount.toLocaleString('en-PK')}</strong>
          </span>
          <span>
            Udhaar: <strong className={`font-mono font-bold ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              Rs {remaining.toLocaleString('en-PK')}
            </strong>
          </span>
        </div>
      )}
    </div>
  )
}
