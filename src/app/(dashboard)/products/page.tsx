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
  pricePerUnit: number
  isActive: boolean
  createdAt: string
}

const EMPTY_FORM: ProductInput = { name: '', nameUrdu: '', unit: 'kg', pricePerUnit: 0 }

interface ProductFormProps {
  initial: ProductInput & { isActive?: boolean }
  onSubmit: (data: ProductInput & { isActive?: boolean }) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
  showActiveToggle?: boolean
}

function ProductForm({ initial, onSubmit, onCancel, submitLabel, isLoading, serverError, showActiveToggle = false }: ProductFormProps) {
  const [form, setForm] = useState({ ...initial })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  function set(field: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Naam zaroor daalo'
    if (!form.unit) next.unit = 'Unit choose karo'
    if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0) next.pricePerUnit = 'Qeemat sahi daalo'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit({ name: form.name.trim(), nameUrdu: form.nameUrdu?.trim() || undefined, unit: form.unit, pricePerUnit: Number(form.pricePerUnit), isActive: form.isActive })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Naam (English)" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Boneless Chicken" error={errors.name} autoFocus />
        <FormField label="Urdu Naam (Roman)" value={form.nameUrdu ?? ''} onChange={e => set('nameUrdu', e.target.value)} placeholder="e.g. Be Haddi" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField as="select" label="Unit" required value={form.unit} onChange={e => set('unit', e.target.value)} error={errors.unit}>
          <option value="kg">kg (Kilogram)</option>
          <option value="piece">Piece (Adad)</option>
        </FormField>
        <FormField label="Qeemat per unit (Rs.)" required type="number" min="1" step="0.01" value={form.pricePerUnit || ''} onChange={e => set('pricePerUnit', e.target.value)} placeholder="e.g. 580" error={errors.pricePerUnit} />
      </div>

      {showActiveToggle && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={e => set('isActive', e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-primary"
          />
          <span className="text-sm font-medium text-text-primary">Active Hai (sale mein show hoga)</span>
        </label>
      )}

      {serverError && (
        <div className="p-3 bg-red-500/15 text-red-500 rounded-lg text-xs font-medium">⚠ {serverError}</div>
      )}

      <div className="flex gap-3 justify-end mt-2">
        <button type="button" onClick={onCancel} disabled={isLoading} className="py-2.5 px-5 text-sm font-semibold rounded-lg border border-border bg-transparent text-text-secondary hover:bg-bg transition-colors cursor-pointer disabled:opacity-50">
          Wapas (Cancel)
        </button>
        <button type="submit" disabled={isLoading} className="py-2.5 px-5 text-sm font-semibold rounded-lg border-none bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 min-h-11">
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

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.nameUrdu ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(data: ProductInput) {
    setFormLoading(true); setFormError(null)
    const res = await api.createProduct(data)
    if (res.success) { setCreateOpen(false); await fetchProducts() }
    else setFormError(res.error ?? 'Kuch masla hua')
    setFormLoading(false)
  }

  async function handleEdit(data: ProductInput & { isActive?: boolean }) {
    if (!editTarget) return
    setFormLoading(true); setFormError(null)
    const res = await api.updateProduct(editTarget.id, data)
    if (res.success) { setEditTarget(null); await fetchProducts() }
    else setFormError(res.error ?? 'Update nahi hua')
    setFormLoading(false)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold m-0 text-text-primary">🐔 Maal (Products)</h2>
          <p className="text-text-secondary mt-1 text-sm">{products.length} products hain</p>
        </div>
        <button id="btn-add-product" onClick={() => { setFormError(null); setCreateOpen(true) }} className="px-5 py-2.5 text-sm font-semibold bg-primary text-white border-none rounded-lg cursor-pointer hover:bg-primary-hover transition-colors min-h-11">
          + Naya Maal
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          id="input-search-products"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Naam se dhundho..."
          className="w-full max-w-xs px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-bg text-text-primary"
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
          action={!search ? <button onClick={() => setCreateOpen(true)} className="px-5 py-2.5 text-sm font-semibold bg-primary text-white border-none rounded-lg cursor-pointer hover:bg-primary-hover transition-colors">+ Naya Maal</button> : undefined}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg border-b border-border">
                  {['Naam', 'Urdu Naam', 'Unit', 'Qeemat', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-bg/60 transition-colors ${i < filtered.length - 1 ? 'border-b border-border' : ''} ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4 font-semibold text-text-primary">{p.name}</td>
                    <td className="px-4 py-4 text-text-secondary italic">{p.nameUrdu ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${p.unit === 'kg' ? 'bg-green-500/15 text-green-600' : 'bg-blue-500/15 text-blue-600'}`}>
                        {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-primary">
                      Rs. {p.pricePerUnit.toLocaleString('en-PK')}
                      <span className="font-normal text-text-secondary text-xs">/{p.unit}</span>
                    </td>
                    <td className="px-4 py-4"><Badge variant={p.isActive ? 'active' : 'inactive'} /></td>
                    <td className="px-4 py-4">
                      <button onClick={() => { setFormError(null); setEditTarget(p) }} title="Edit karo" className="px-2.5 py-1.5 rounded-md border border-border bg-transparent text-text-secondary hover:bg-bg cursor-pointer transition-colors text-sm">✏</button>
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
        <ProductForm initial={EMPTY_FORM} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitLabel="Banao" isLoading={formLoading} serverError={formError} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Maal Badlo">
        {editTarget && (
          <ProductForm initial={{ name: editTarget.name, nameUrdu: editTarget.nameUrdu ?? '', unit: editTarget.unit, pricePerUnit: editTarget.pricePerUnit, isActive: editTarget.isActive }} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} submitLabel="Save Karo" isLoading={formLoading} serverError={formError} showActiveToggle />
        )}
      </Modal>
    </div>
  )
}

// ─── Shared Sub-components ────────────────────────────────────────
export function LoadingSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-4 p-4 border-b border-border last:border-b-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 rounded bg-border animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-6 bg-red-500/15 text-red-500 rounded-xl text-sm font-medium">
      ⚠ {message} —{' '}
      <button onClick={onRetry} className="underline bg-transparent border-none cursor-pointer text-inherit">Dobara try karo</button>
    </div>
  )
}
