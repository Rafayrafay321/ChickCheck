'use client'

import React, { useState } from 'react'
import type { ProductInput } from '@/shared/types'

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden'

export interface ProductFormProps {
  initial: ProductInput & { isActive?: boolean }
  onSubmit: (data: ProductInput & { isActive?: boolean }) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
  showActiveToggle?: boolean
}

export function ProductForm({ initial, onSubmit, onCancel, submitLabel, isLoading, serverError, showActiveToggle = false }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initial.name,
    nameUrdu: initial.nameUrdu ?? '',
    unit: initial.unit ?? 'kg',
    pricingType: initial.pricingType ?? (initial.isByproduct ? 'FIXED' : 'MULTIPLIER'),
    defaultMultiplier: initial.defaultMultiplier ?? 1.5,
    pricePerUnit: initial.pricePerUnit ?? 0,
    isByproduct: initial.isByproduct ?? false,
    isActive: initial.isActive ?? true,
  })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  function set(field: string, value: string | number | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'isByproduct' && value === true && prev.pricingType === 'MULTIPLIER') {
        next.pricingType = 'FIXED'
        if (!prev.pricePerUnit) next.pricePerUnit = 300
      }
      return next
    })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Naam zaroori hai'
    if (form.pricingType === 'MULTIPLIER' && (!form.defaultMultiplier || Number(form.defaultMultiplier) <= 0)) {
      next.defaultMultiplier = 'Multiplier daalo'
    }
    if (form.pricingType === 'FIXED' && (!form.pricePerUnit || Number(form.pricePerUnit) <= 0)) {
      next.pricePerUnit = 'Rate daalo'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        name: form.name.trim(),
        nameUrdu: form.nameUrdu.trim() || undefined,
        unit: form.unit as 'kg' | 'piece',
        pricingType: form.pricingType as 'MULTIPLIER' | 'FIXED',
        defaultMultiplier: form.pricingType === 'MULTIPLIER' ? Number(form.defaultMultiplier) : undefined,
        pricePerUnit: form.pricingType === 'FIXED' ? Number(form.pricePerUnit) : 0,
        isByproduct: form.isByproduct,
        isActive: form.isActive,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {serverError && (
        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{serverError}</div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Naam (English) *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Chicken Meat" autoFocus className={INPUT_CLASS} />
          {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Urdu Naam</label>
          <input value={form.nameUrdu} onChange={(e) => set('nameUrdu', e.target.value)} placeholder="اردو نام" dir="rtl" className={INPUT_CLASS} />
        </div>
      </div>

      {/* Unit + Pricing type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Unit</label>
          <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className={`${INPUT_CLASS} cursor-pointer`}>
            <option value="kg">kg</option>
            <option value="piece">piece</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Pricing</label>
          <select value={form.pricingType} onChange={(e) => set('pricingType', e.target.value)} className={`${INPUT_CLASS} cursor-pointer`}>
            <option value="MULTIPLIER">Mandi Multiplier</option>
            <option value="FIXED">Fixed Rate</option>
          </select>
        </div>
      </div>

      {/* Pricing value */}
      {form.pricingType === 'MULTIPLIER' ? (
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Multiplier (× Mandi Rate)</label>
          <input type="number" step="0.05" min="0.1" max="10" value={form.defaultMultiplier || ''} onChange={(e) => set('defaultMultiplier', parseFloat(e.target.value) || 0)} placeholder="1.5" className={INPUT_CLASS} />
          {errors.defaultMultiplier && <p className="text-[10px] text-red-500 mt-0.5">{errors.defaultMultiplier}</p>}
        </div>
      ) : (
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Fixed Price (Rs/{form.unit})</label>
          <input type="number" step="1" min="0" value={form.pricePerUnit || ''} onChange={(e) => set('pricePerUnit', parseFloat(e.target.value) || 0)} placeholder="300" className={INPUT_CLASS} />
          {errors.pricePerUnit && <p className="text-[10px] text-red-500 mt-0.5">{errors.pricePerUnit}</p>}
        </div>
      )}

      {/* Checkboxes */}
      <div className="flex items-center gap-5 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isByproduct} onChange={(e) => set('isByproduct', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
          <span className="font-medium text-slate-700">Byproduct</span>
        </label>
        {showActiveToggle && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
            <span className="font-medium text-slate-700">Active</span>
          </label>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} disabled={isLoading} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50">
          {isLoading ? '...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
