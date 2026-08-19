'use client'

import React, { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import type { ProductInput } from '@/shared/types'

export interface ProductFormProps {
  initial: ProductInput & { isActive?: boolean }
  onSubmit: (data: ProductInput & { isActive?: boolean }) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
  showActiveToggle?: boolean
}

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  isLoading,
  serverError,
  showActiveToggle = false,
}: ProductFormProps) {
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
    if (!form.name.trim()) next.name = 'Naam zaroor daalo'
    if (!form.unit) next.unit = 'Unit choose karo'

    if (form.pricingType === 'MULTIPLIER') {
      if (!form.defaultMultiplier || Number(form.defaultMultiplier) <= 0) {
        next.defaultMultiplier = 'Mandi Multiplier sahi daalo (e.g. 2.0 ya 1.5)'
      }
    } else {
      if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0) {
        next.pricePerUnit = 'Fixed Rate (Rs) sahi daalo'
      }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Maal Ka Naam (English)" required error={errors.name}>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Chicken Meat, Boneless, Wings..."
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </FormField>

      <FormField label="Urdu Naam (Optional)">
        <input
          value={form.nameUrdu}
          onChange={(e) => set('nameUrdu', e.target.value)}
          placeholder="مثلاً: مرغی کا گوشت، بون لیس"
          dir="rtl"
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </FormField>

      <FormField label="Unit" required error={errors.unit}>
        <select
          value={form.unit}
          onChange={(e) => set('unit', e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="kg">
  kg (Kilogram)</option>
          <option value="piece">
  piece (Dozens / Pieces)</option>
        </select>
      </FormField>

      {/* Pricing Type Toggle */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
  Pricing Ka Tareeqa (Pricing Mode)
        </label>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => set('pricingType', 'MULTIPLIER')}
            className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
              form.pricingType === 'MULTIPLIER'
                ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center gap-1"> Mandi Multiplier</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-normal">
  Farm Rate × Multiplier (Meat, Boneless)</div>
          </button>

          <button
            type="button"
            onClick={() => set('pricingType', 'FIXED')}
            className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
              form.pricingType === 'FIXED'
                ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center gap-1"> Fixed Flat Rate</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-normal">
  Pakka Rs rate per kg (Kalagi, Poota)</div>
          </button>
        </div>

        {form.pricingType === 'MULTIPLIER' ? (
          <FormField
            label="Default Mandi Multiplier (Zarab)"
            required
            error={errors.defaultMultiplier}
            hint="Daily Farm Supply Rate is multiplier se multiply hoga (e.g. 1.5 ya 2.0)"
          >
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="10"
                value={form.defaultMultiplier || ''}
                onChange={(e) => set('defaultMultiplier', parseFloat(e.target.value) || 0)}
                placeholder="1.5"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 font-bold shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">× Mandi Rate</span>
            </div>
          </FormField>
        ) : (
          <FormField
            label="Fixed Price Per Unit (Rs)"
            required
            error={errors.pricePerUnit}
            hint="Is product ka fixed rate (e.g. Rs 350 /kg)"
          >
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                value={form.pricePerUnit || ''}
                onChange={(e) => set('pricePerUnit', parseFloat(e.target.value) || 0)}
                placeholder="300"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 font-bold shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
  Rs /{form.unit}</span>
            </div>
          </FormField>
        )}
      </div>

      {/* Byproduct Checkbox */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-1.5">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isByproduct}
            onChange={(e) => set('isByproduct', e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-amber-600 rounded border-amber-300"
          />
          <span className="text-sm font-bold text-amber-900">
  Ye Byproduct Hai? (Kalagi, Poota, Necks, Wings)
          </span>
        </label>
        <p className="text-xs text-amber-700 leading-relaxed ml-6">
  Byproducts murgi kaatne par khud ba khud nikalte hain. Inki sale se <strong>
  Live Weight Pool se stock deduct NAHI hoga</strong>.
        </p>
      </div>

      {showActiveToggle && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-blue-600 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">
  Active Hai (sale mein show hoga)</span>
        </label>
      )}

      {serverError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
          {serverError}
        </div>
      )}

      <div className="flex gap-3 justify-end mt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-50"
        >
  Wapas (Cancel)
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11"
        >
          {isLoading ? '...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
