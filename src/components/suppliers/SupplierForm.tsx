'use client'

import React, { useState } from 'react'
import type { SupplierFormValues } from './types'

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden'

export interface SupplierFormProps {
  initial: SupplierFormValues
  onSubmit: (data: SupplierFormValues) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
}

export function SupplierForm({ initial, onSubmit, onCancel, submitLabel, isLoading, serverError }: SupplierFormProps) {
  const [form, setForm] = useState<SupplierFormValues>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormValues, string>>>({})

  function set(field: keyof SupplierFormValues, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Naam zaroori hai' }); return }
    onSubmit({
      name: form.name.trim(),
      phone: form.phone?.trim() || undefined,
      address: form.address?.trim() || undefined,
      ratePremium: form.ratePremium !== undefined ? Number(form.ratePremium) : 4,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {serverError && (
        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{serverError}</div>
      )}

      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">Supplier Naam *</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Haji Shabeen, Faisal Farms..." autoFocus className={INPUT_CLASS} />
        {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Markup / Discount (Rs/kg)</label>
          <input type="number" step="0.5" value={form.ratePremium !== undefined ? String(form.ratePremium) : '4'} onChange={(e) => set('ratePremium', e.target.value === '' ? '' : Number(e.target.value))} placeholder="4 ya -8" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Phone</label>
          <input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="03XX-XXXXXXX" className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">Address (Optional)</label>
        <input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Mandi road, Chak 45..." className={INPUT_CLASS} />
      </div>

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
