'use client'

import React, { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import type { CustomerInput } from '@/shared/types'

export interface CustomerFormProps {
  initial: CustomerInput
  onSubmit: (data: CustomerInput) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
}

export function CustomerForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  isLoading,
  serverError,
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerInput>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({})

  function set(field: keyof CustomerInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Naam zaroor daalo'
    if (!form.type) next.type = 'Type choose karo'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        name: form.name.trim(),
        type: form.type,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        label="Naam (Name)"
        required
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="e.g. Al-Noor Restaurant"
        error={errors.name}
        autoFocus
      />
      <FormField
        as="select"
        label="Qisam (Type)"
        required
        value={form.type}
        onChange={(e) => set('type', e.target.value as 'RESTAURANT' | 'RETAIL')}
        error={errors.type}
      >
        <option value="RETAIL">
  Retail (Dukaan)</option>
        <option value="RESTAURANT">
  Restaurant (Hotel)</option>
      </FormField>
      <FormField
        label="Phone"
        value={form.phone ?? ''}
        onChange={(e) => set('phone', e.target.value)}
        placeholder="03XX-XXXXXXX"
        type="tel"
      />
      <FormField
        label="Pata (Address)"
        value={form.address ?? ''}
        onChange={(e) => set('address', e.target.value)}
        placeholder="Mohalla, gali number..."
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
