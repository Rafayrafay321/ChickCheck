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

function computeRate(farmRate?: number, premium: number = 4): string {
  return farmRate !== undefined && farmRate > 0 ? String(farmRate + premium) : ''
}

function createRow(supplier?: SupplierOption, farmRate?: number): PurchaseRowState {
  return {
    key: Math.random().toString(36).substring(2, 9),
    supplierId: supplier?.id || '',
    supplierName: supplier?.name || '',
    grossWeight: '',
    ratePerKg: computeRate(farmRate, supplier?.ratePremium ?? 4),
    cashPaid: '',
  }
}

export function SupplierPurchaseForm({ onSubmit, onCancel }: SupplierPurchaseFormProps) {
  const { dailyRate } = useDailyRate()
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(true)
  const [rows, setRows] = useState<PurchaseRowState[]>([createRow(undefined, dailyRate?.farmRate)])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load active suppliers
  useEffect(() => {
    async function load() {
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
    load()
  }, [dailyRate?.farmRate])

  // Fill rate when dailyRate arrives
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
        next[index] = {
          ...next[index],
          supplierId: selected.id,
          supplierName: selected.name,
          ratePerKg: computeRate(dailyRate?.farmRate, selected.ratePremium) || next[index].ratePerKg,
        }
      }
      return next
    })
  }, [suppliers, dailyRate?.farmRate])

  const updateField = useCallback((index: number, field: keyof PurchaseRowState, value: string) => {
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const addRow = useCallback(() => {
    const used = new Set(rows.map((r) => r.supplierId))
    const unused = suppliers.find((s) => !used.has(s.id)) || suppliers[0]
    setRows((prev) => [...prev, createRow(unused, dailyRate?.farmRate)])
  }, [rows, suppliers, dailyRate?.farmRate])

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Calculations
  const { rowCalcs, totals } = useMemo(() => {
    const calcs = rows.map((r) => {
      const gross = parseFloat(r.grossWeight) || 0
      const rate = parseFloat(r.ratePerKg) || 0
      const amount = gross * rate
      const cash = parseFloat(r.cashPaid) || 0
      return { gross, rate, amount, cash }
    })

    const agg = calcs.reduce(
      (acc, c) => ({
        gross: acc.gross + c.gross,
        amount: acc.amount + c.amount,
        cash: acc.cash + c.cash,
      }),
      { gross: 0, amount: 0, cash: 0 }
    )

    return { rowCalcs: calcs, totals: agg }
  }, [rows])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!dailyRate) {
      setError('Pehle aaj ka Farm Rate set karein')
      return
    }
    if (suppliers.length === 0) {
      setError('Pehle Suppliers page se supplier add karein')
      return
    }

    const items: SupplierPurchaseInput[] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const c = rowCalcs[i]
      if (!r.supplierId) { setError(`Row ${i + 1}: Supplier select karein`); return }
      if (c.gross <= 0) { setError(`Row ${i + 1}: Wazan daalein`); return }
      if (c.rate <= 0) { setError(`Row ${i + 1}: Rate daalein`); return }

      items.push({
        supplierId: r.supplierId,
        supplierName: r.supplierName,
        grossWeight: c.gross,
        dudWeight: 0,
        ratePerKg: c.rate,
        cashPaid: c.cash,
      })
    }

    setSubmitting(true)
    const result = await onSubmit(items.length === 1 ? items[0] : items)
    setSubmitting(false)
    if (!result.success) setError(result.error || 'Save fail ho gaya')
  }

  // Empty state — no suppliers registered
  if (!suppliersLoading && suppliers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-800">Koi Supplier Registered Nahi Hai</p>
        <p className="text-xs text-slate-500">Pehle Suppliers page par apne suppliers add karein.</p>
        <div className="flex justify-center gap-3 pt-1">
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 cursor-pointer">
              Cancel
            </button>
          )}
          <Link href="/suppliers" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">
            Suppliers Page
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{error}</div>
      )}

      {!dailyRate && (
        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          Pehle aaj ka Farm Rate set karein
        </div>
      )}

      {/* Delivery rows */}
      <div className="space-y-2.5">
        {rows.map((row, idx) => (
          <PurchaseRowItem
            key={row.key}
            index={idx}
            row={row}
            calc={rowCalcs[idx]}
            suppliers={suppliers}
            canRemove={rows.length > 1}
            onSupplierChange={handleSupplierChange}
            onFieldChange={updateField}
            onRemove={removeRow}
          />
        ))}
      </div>

      {/* Add row */}
      {suppliers.length > 0 && (
        <button
          type="button"
          onClick={addRow}
          className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
        >
          + Aur Supplier
        </button>
      )}

      {/* Grand totals */}
      {rows.length > 0 && <PurchaseGrandTotals rowCount={rows.length} totals={totals} />}

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || suppliers.length === 0}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
