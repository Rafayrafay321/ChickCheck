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
  dudWeight: string
  ratePerKg: string
  cashPaid: string
}

export interface RowCalculation {
  gross: number
  dud: number
  net: number
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

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden'

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
  const selectedSupplier = suppliers.find((s) => s.id === row.supplierId)

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3 shadow-2xs">
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-slate-800">
            Supplier Delivery #{index + 1}
          </span>
          {selectedSupplier && (
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded">
              +Rs {selectedSupplier.ratePremium}/kg markup
            </span>
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            Remove Row
          </button>
        )}
      </div>

      {/* Supplier Selection */}
      <div>
        <select
          value={row.supplierId}
          onChange={(e) => onSupplierChange(index, e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} (+Rs {s.ratePremium}/kg)
            </option>
          ))}
        </select>
      </div>

      {/* Numeric Inputs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Gross Wt (Kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            required
            inputMode="decimal"
            placeholder="e.g. 244"
            value={row.grossWeight}
            onChange={(e) => onFieldChange(index, 'grossWeight', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Dud Wt (Kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            placeholder="0"
            value={row.dudWeight}
            onChange={(e) => onFieldChange(index, 'dudWeight', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Rate / Kg (PKR)
          </label>
          <input
            type="number"
            step="1"
            min="1"
            required
            inputMode="numeric"
            placeholder="e.g. 304"
            value={row.ratePerKg}
            onChange={(e) => onFieldChange(index, 'ratePerKg', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Spot Cash Paid
          </label>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            placeholder="0"
            value={row.cashPaid}
            onChange={(e) => onFieldChange(index, 'cashPaid', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Row Summary */}
      <div className="flex items-center justify-between text-xs bg-white rounded-lg p-2.5 border border-slate-200">
        <div className="flex gap-4 items-center">
          <span className="text-slate-500">
            Saaf Wazan: <strong className="text-slate-900">{calc.net.toFixed(1)} kg</strong>
          </span>
          <span className="text-slate-500">
            Bill: <strong className="text-blue-600">Rs {calc.amount.toLocaleString('en-PK')}</strong>
          </span>
        </div>
        <div>
          <span className="text-slate-500">
            Baqi Udhaar: <strong className={calc.amount - calc.cash > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
              Rs {Math.max(0, calc.amount - calc.cash).toLocaleString('en-PK')}
            </strong>
          </span>
        </div>
      </div>
    </div>
  )
}
