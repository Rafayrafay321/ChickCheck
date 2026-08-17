'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { FormField } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ProductInput } from '@/shared/types'

interface Product {
  id: string
  name: string
  nameUrdu: string | null
  unit: 'kg' | 'piece'
  pricingType: 'MULTIPLIER' | 'FIXED'
  defaultMultiplier: number | null
  pricePerUnit: number
  isByproduct: boolean
  isActive: boolean
  createdAt: string
}

const EMPTY_FORM: ProductInput = {
  name: '',
  nameUrdu: '',
  unit: 'kg',
  pricingType: 'MULTIPLIER',
  defaultMultiplier: 1.5,
  pricePerUnit: 0,
  isByproduct: false,
}

interface ProductFormProps {
  initial: ProductInput & { isActive?: boolean }
  onSubmit: (data: ProductInput & { isActive?: boolean }) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
  showActiveToggle?: boolean
}

function ProductForm({
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
        nameUrdu: form.nameUrdu?.trim() || undefined,
        unit: form.unit,
        pricingType: form.pricingType,
        defaultMultiplier: form.pricingType === 'MULTIPLIER' ? Number(form.defaultMultiplier) : undefined,
        pricePerUnit: form.pricingType === 'FIXED' ? Number(form.pricePerUnit) : 0,
        isByproduct: form.isByproduct,
        isActive: form.isActive,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Names */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Naam (English)"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Boneless Chicken"
          error={errors.name}
          autoFocus
        />
        <FormField
          label="Urdu Naam (Roman)"
          value={form.nameUrdu}
          onChange={(e) => set('nameUrdu', e.target.value)}
          placeholder="e.g. Be Haddi"
        />
      </div>

      {/* Unit */}
      <div>
        <FormField
          as="select"
          label="Unit"
          required
          value={form.unit}
          onChange={(e) => set('unit', e.target.value)}
          error={errors.unit}
        >
          <option value="kg">kg (Kilogram)</option>
          <option value="piece">Piece (Adad)</option>
        </FormField>
      </div>

      {/* Pricing Type Toggle */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
          Qeemat Ka Tareeqa (Pricing Mode)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => set('pricingType', 'MULTIPLIER')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              form.pricingType === 'MULTIPLIER'
                ? 'bg-blue-50 border-blue-500 text-blue-900'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold">📈 Mandi Multiplier</div>
            <div className="text-[11px] opacity-75 mt-0.5">Murgi & Cuts (Boneless, Meat, Tikka)</div>
          </button>

          <button
            type="button"
            onClick={() => set('pricingType', 'FIXED')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              form.pricingType === 'FIXED'
                ? 'bg-blue-50 border-blue-500 text-blue-900'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold">🏷️ Fixed Flat Rate (Rs)</div>
            <div className="text-[11px] opacity-75 mt-0.5">Kalagi, Poota, Necks, Wings</div>
          </button>
        </div>
      </div>

      {/* Multiplier OR Fixed Rate Input */}
      {form.pricingType === 'MULTIPLIER' ? (
        <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-2">
          <FormField
            label="Mandi Multiplier (e.g. 2.0 for Boneless, 1.5 for Meat, 1.6 for Tikka)"
            required
            type="number"
            min="0.5"
            step="0.05"
            value={form.defaultMultiplier || ''}
            onChange={(e) => set('defaultMultiplier', e.target.value)}
            placeholder="e.g. 2.0"
            error={errors.defaultMultiplier}
          />
          <p className="text-[11px] text-blue-700 m-0 leading-relaxed">
            💡 <strong>Static Rs ki zaroorat nahi hai.</strong> Selling Rate roz subah{' '}
            <code>Mandi Supply Rate × {form.defaultMultiplier || 'Multiplier'}</code> se live calculate hoga.
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <FormField
            label="Fixed Rate per unit (Rs.)"
            required
            type="number"
            min="1"
            step="1"
            value={form.pricePerUnit || ''}
            onChange={(e) => set('pricePerUnit', e.target.value)}
            placeholder="e.g. 300"
            error={errors.pricePerUnit}
          />
          <p className="text-[11px] text-slate-500 m-0">
            Yeh item roz fixed rate par bikega (Mandi multiplier se koi taluq nahi).
          </p>
        </div>
      )}

      {/* Byproduct toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors">
        <input
          type="checkbox"
          checked={form.isByproduct}
          onChange={(e) => set('isByproduct', e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-amber-600 rounded border-slate-300"
        />
        <div>
          <span className="text-sm font-semibold text-amber-800 block">
            ⚡ Byproduct hai (Kaleji, Pota, Wings, Necks)
          </span>
          <span className="text-xs text-amber-600">
            Tick karein — iss product ki sale se Live Hen Pool deduct nahi hoga
          </span>
        </div>
      </label>

      {showActiveToggle && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-blue-600 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">Active Hai (sale mein show hoga)</span>
        </label>
      )}

      {serverError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
          ⚠ {serverError}
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    const res = await api.getProducts()
    if (res.success && Array.isArray(res.data)) {
      setProducts(res.data as Product[])
    } else {
      setFetchError(res.error ?? 'Data load nahi hua')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameUrdu ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(data: ProductInput) {
    setFormLoading(true)
    setFormError(null)
    const res = await api.createProduct(data)
    if (res.success) {
      setCreateOpen(false)
      await fetchProducts()
    } else {
      setFormError(res.error ?? 'Kuch masla hua')
    }
    setFormLoading(false)
  }

  async function handleEdit(data: ProductInput & { isActive?: boolean }) {
    if (!editTarget) return
    setFormLoading(true)
    setFormError(null)
    const res = await api.updateProduct(editTarget.id, data)
    if (res.success) {
      setEditTarget(null)
      await fetchProducts()
    } else {
      setFormError(res.error ?? 'Update nahi hua')
    }
    setFormLoading(false)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">🐔 Maal (Products)</h2>
          <p className="text-sm text-slate-500 mt-1">{products.length} products dukan mein active hain</p>
        </div>
        <button
          id="btn-add-product"
          onClick={() => {
            setFormError(null)
            setCreateOpen(true)
          }}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          + Naya Maal
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-xs">
        <input
          id="input-search-products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Naam se dhundho..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Table / States */}
      {isLoading ? (
        <LoadingSkeleton cols={5} />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchProducts} />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🐔"
          title={search ? 'Koi nahi mila' : 'Abhi koi maal nahi hai'}
          description={search ? 'Search clear karo' : 'Pehla product add karo — jaise Whole Chicken, Boneless, Wings'}
          action={
            !search ? (
              <button
                onClick={() => setCreateOpen(true)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                + Naya Maal
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Naam', 'Urdu Naam', 'Unit', 'Qeemat / Multiplier', 'Type & Status', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-4 py-4 text-slate-500 italic">{p.nameUrdu ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          p.unit === 'kg' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {p.pricingType === 'MULTIPLIER' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-xs">
                          📈 {p.defaultMultiplier ?? 1.0}× Mandi Rate
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 text-sm">
                          Rs. {p.pricePerUnit.toLocaleString('en-PK')}{' '}
                          <span className="font-normal text-slate-400 text-xs">/{p.unit}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={p.isActive ? 'active' : 'inactive'} />
                        {p.isByproduct && (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                            ⚡ Byproduct
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          setFormError(null)
                          setEditTarget(p)
                        }}
                        title="Edit karo"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                      >
                        ✏ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Naya Maal Banao">
        <ProductForm
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel="Banao"
          isLoading={formLoading}
          serverError={formError}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Maal Badlo">
        {editTarget && (
          <ProductForm
            initial={{
              name: editTarget.name,
              nameUrdu: editTarget.nameUrdu ?? '',
              unit: editTarget.unit,
              pricingType: editTarget.pricingType,
              defaultMultiplier: editTarget.defaultMultiplier ?? 1.5,
              pricePerUnit: editTarget.pricePerUnit,
              isByproduct: editTarget.isByproduct,
              isActive: editTarget.isActive,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Save Karo"
            isLoading={formLoading}
            serverError={formError}
            showActiveToggle
          />
        )}
      </Modal>
    </div>
  )
}

// ─── Shared Sub-components ────────────────────────────────────────
export function LoadingSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-100 last:border-b-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 rounded bg-slate-200 animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
      ⚠ {message} —{' '}
      <button onClick={onRetry} className="underline cursor-pointer font-bold">
        Dobara try karo
      </button>
    </div>
  )
}
