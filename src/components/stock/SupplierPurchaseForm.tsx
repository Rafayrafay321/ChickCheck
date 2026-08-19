'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useDailyRate } from '@/hooks/useDailyRate'
import { PurchaseRowItem, type SupplierOption, type PurchaseRowState } from './PurchaseRowItem'
import { PurchaseGrandTotals } from './PurchaseGrandTotals'
import type { SupplierPurchaseInput } from '@/shared/types'

interface SupplierPurchaseFormProps {
  onSubmit: (input: SupplierPurchaseInput | SupplierPurchaseInput[]) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
}

function computeRate(farmRate?: number, ratePremium: number = 4): string {
  return farmRate !== undefined && farmRate > 0 ? String(farmRate + ratePremium) : ''
}

function createEmptyRow(supplier?: SupplierOption, farmRate?: number): PurchaseRowState {
  return {
    key: Math.random().toString(36).substring(2, 9),
    supplierId: supplier?.id || '',
    supplierName: supplier?.name || '',
    grossWeight: '',
    dudWeight: '0',
    ratePerKg: computeRate(farmRate, supplier?.ratePremium ?? 4),
    cashPaid: '',
  }
}

export function SupplierPurchaseForm({ onSubmit, onCancel }: SupplierPurchaseFormProps) {
  const { dailyRate } = useDailyRate()
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(true)
  const [rows, setRows] = useState<PurchaseRowState[]>([createEmptyRow(undefined, dailyRate?.farmRate)])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load active suppliers from database
  useEffect(() => {
    async function loadSuppliers() {
      try {
        setSuppliersLoading(true)
        const res = await api.getSuppliers(undefined, true)
        if (res.success && Array.isArray(res.data)) {
          const list: SupplierOption[] = res.data.map((s) => ({
            id: s.id,
            name: s.name,
            ratePremium: s.ratePremium ?? 4,
          }))
          setSuppliers(list)

          if (list.length > 0) {
            setRows((prev) => {
              if (prev.length === 1 && prev[0].grossWeight === '') {
                const first = list[0]
                return [{
                  ...prev[0],
                  supplierId: first.id,
                  supplierName: first.name,
                  ratePerKg: prev[0].ratePerKg || computeRate(dailyRate?.farmRate, first.ratePremium),
                }]
              }
              return prev
            })
          }
        }
      } finally {
        setSuppliersLoading(false)
      }
    }
    loadSuppliers()
  }, [dailyRate?.farmRate])

  // Sync initial rate when dailyRate is ready
  useEffect(() => {
    if (dailyRate?.farmRate) {
      setRows((prev) =>
        prev.map((row) => {
          if (row.ratePerKg === '' && row.supplierId) {
            const sup = suppliers.find((s) => s.id === row.supplierId)
            return { ...row, ratePerKg: computeRate(dailyRate.farmRate, sup?.ratePremium ?? 4) }
          }
          return row
        })
      )
    }
  }, [dailyRate?.farmRate, suppliers])

  const handleSupplierChange = useCallback((index: number, supplierId: string) => {
    setRows((prev) => {
      const next = [...prev]
      const selected = suppliers.find((s) => s.id === supplierId)
      if (selected) {
        const rate = computeRate(dailyRate?.farmRate, selected.ratePremium)
        next[index] = {
          ...next[index],
          supplierId: selected.id,
          supplierName: selected.name,
          ratePerKg: rate || next[index].ratePerKg,
        }
      }
      return next
    })
  }, [suppliers, dailyRate?.farmRate])

  const updateRowField = useCallback((index: number, field: keyof PurchaseRowState, value: string) => {
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const addRow = useCallback(() => {
    const usedSupplierIds = new Set(rows.map((r) => r.supplierId))
    const unused = suppliers.find((s) => !usedSupplierIds.has(s.id)) || suppliers[0]
    setRows((prev) => [...prev, createEmptyRow(unused, dailyRate?.farmRate)])
  }, [rows, suppliers, dailyRate?.farmRate])

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Derived Calculations & Totals
  const { rowCalculations, totals } = useMemo(() => {
    const calcs = rows.map((r) => {
      const gross = parseFloat(r.grossWeight) || 0
      const dud = parseFloat(r.dudWeight) || 0
      const net = Math.max(0, gross - dud)
      const rate = parseFloat(r.ratePerKg) || 0
      const amount = net * rate
      const cash = parseFloat(r.cashPaid) || 0
      return { gross, dud, net, rate, amount, cash }
    })

    const agg = calcs.reduce(
      (acc, r) => ({
        gross: acc.gross + r.gross,
        dud: acc.dud + r.dud,
        net: acc.net + r.net,
        amount: acc.amount + r.amount,
        cash: acc.cash + r.cash,
      }),
      { gross: 0, dud: 0, net: 0, amount: 0, cash: 0 }
    )

    return { rowCalculations: calcs, totals: agg }
  }, [rows])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!dailyRate) {
      setError('Pehle aaj ka Farm Rate enter karein!')
      return
    }

    if (suppliers.length === 0) {
      setError('Koi supplier registered nahi hai. Pehle Suppliers page se naya supplier add karein.')
      return
    }

    const payloadItems: SupplierPurchaseInput[] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const calc = rowCalculations[i]

      if (!r.supplierId || !r.supplierName) {
        setError(`Row #${i + 1}: Supplier choose karein`)
        return
      }
      if (calc.gross <= 0) {
        setError(`Row #${i + 1} (${r.supplierName}): Gross Weight daalein`)
        return
      }
      if (calc.rate <= 0) {
        setError(`Row #${i + 1} (${r.supplierName}): Purchasing Rate per kg daalein`)
        return
      }

      payloadItems.push({
        supplierId: r.supplierId,
        supplierName: r.supplierName,
        grossWeight: calc.gross,
        dudWeight: calc.dud,
        ratePerKg: calc.rate,
        cashPaid: calc.cash,
      })
    }

    setSubmitting(true)
    const result = await onSubmit(payloadItems.length === 1 ? payloadItems[0] : payloadItems)
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Purchases save fail ho gayi')
    }
  }

  if (!suppliersLoading && suppliers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
        <div className="text-sm font-semibold text-slate-800">
          Koi Supplier Registered Nahi Hai
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Maal khareedari record karne ke liye pehle Suppliers page par apne suppliers add karein.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          )}
          <Link
            href="/suppliers"
            onClick={onCancel}
            className="inline-flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
          >
            + Suppliers Page Par Jayein
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
          {error}
        </div>
      )}

      {dailyRate ? (
        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs text-blue-900">
          <div>
            <span>Farm Rate: <strong>Rs {dailyRate.farmRate}</strong></span>
            <span className="mx-2 text-blue-300">|</span>
            <span>Standard Supply Rate: <strong>Rs {dailyRate.supplyRate}</strong></span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          <strong>Aaj Ka Rate Missing Hai!</strong> Pehle top bar par click karke aaj ka Farm Rate set karein.
        </div>
      )}

      {/* Rows Container */}
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {rows.map((row, idx) => (
          <PurchaseRowItem
            key={row.key}
            index={idx}
            row={row}
            calc={rowCalculations[idx]}
            suppliers={suppliers}
            canRemove={rows.length > 1}
            onSupplierChange={handleSupplierChange}
            onFieldChange={updateRowField}
            onRemove={removeRow}
          />
        ))}
      </div>

      {/* Add Another Delivery Row */}
      {suppliers.length > 0 && (
        <button
          type="button"
          onClick={addRow}
          className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          + Agla Supplier Shamil Karein (Add Delivery Row)
        </button>
      )}

      {/* Batch Grand Totals Footer */}
      {rows.length > 0 && <PurchaseGrandTotals rowCount={rows.length} totals={totals} />}

      {/* Form Action Buttons */}
      <div className="flex gap-3 justify-end mt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || suppliers.length === 0}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11 flex-1 sm:flex-initial"
        >
          {submitting ? 'Saving...' : rows.length > 1 ? `Save All (${rows.length} Deliveries)` : 'Save Purchase Entry'}
        </button>
      </div>
    </form>
  )
}
