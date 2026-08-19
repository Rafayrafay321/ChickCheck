'use client'

import React, { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import type { SupplierFormValues } from './types'

export interface SupplierFormProps {
  initial: SupplierFormValues
  onSubmit: (data: SupplierFormValues) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
}

export function SupplierForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  isLoading,
  serverError,
}: SupplierFormProps) {
  const [form, setForm] = useState<SupplierFormValues>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormValues, string>>>({})

  function set(field: keyof SupplierFormValues, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Supplier ka naam zaroori hai'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        ratePremium: form.ratePremium !== undefined ? Number(form.ratePremium) : 4,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        label="Supplier Ka Naam (Farm / Supplier Name)"
        required
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="e.g. Haji Shabeen, Faisal Farms, Malik Broiler..."
        error={errors.name}
        autoFocus
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Farm Rate se Upar Markup (Extra Rs/Kg)"
          value={form.ratePremium !== undefined ? String(form.ratePremium) : '4'}
          onChange={(e) => set('ratePremium', e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="4"
          type="number"
          step="0.5"
        />
        <FormField
          label="Phone Number (Optional)"
          value={form.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="03XX-XXXXXXX"
          type="tel"
        />
      </div>

      <FormField
        label="Pata / Farm Location (Optional)"
        value={form.address ?? ''}
        onChange={(e) => set('address', e.target.value)}
        placeholder="Mandi road, Chak 45..."
      />

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
