'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { FormField } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'
import type { CustomerInput } from '@/shared/types'

// ─── Types ───────────────────────────────────────────────────────
interface Customer {
  id: string
  name: string
  type: 'RESTAURANT' | 'RETAIL'
  phone: string | null
  address: string | null
  totalUdhaar: number
  createdAt: string
}

type FilterType = 'ALL' | 'RESTAURANT' | 'RETAIL'

const EMPTY_FORM: CustomerInput = { name: '', type: 'RETAIL', phone: '', address: '' }

// ─── Customer Form ────────────────────────────────────────────────
interface CustomerFormProps {
  initial: CustomerInput
  onSubmit: (data: CustomerInput) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
  serverError: string | null
}

function CustomerForm({ initial, onSubmit, onCancel, submitLabel, isLoading, serverError }: CustomerFormProps) {
  const [form, setForm] = useState<CustomerInput>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({})

  function set(field: keyof CustomerInput, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
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
        onChange={e => set('name', e.target.value)}
        placeholder="e.g. Al-Noor Restaurant"
        error={errors.name}
        autoFocus
      />
      <FormField
        as="select"
        label="Qisam (Type)"
        required
        value={form.type}
        onChange={e => set('type', e.target.value as 'RESTAURANT' | 'RETAIL')}
        error={errors.type}
      >
        <option value="RETAIL">Retail (Dukaan)</option>
        <option value="RESTAURANT">Restaurant (Hotel)</option>
      </FormField>
      <FormField
        label="Phone"
        value={form.phone ?? ''}
        onChange={e => set('phone', e.target.value)}
        placeholder="03XX-XXXXXXX"
        type="tel"
      />
      <FormField
        label="Pata (Address)"
        value={form.address ?? ''}
        onChange={e => set('address', e.target.value)}
        placeholder="Mohalla, gali number..."
      />

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

// ─── Main Page ───────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    const res = await api.getCustomers()
    if (res.success && Array.isArray(res.data)) {
      setCustomers(res.data as Customer[])
    } else {
      setFetchError(res.error ?? 'Data load nahi hua')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter
    return matchesSearch && matchesType
  })

  async function handleCreate(data: CustomerInput) {
    setFormLoading(true)
    setFormError(null)
    const res = await api.createCustomer(data)
    if (res.success) { setCreateOpen(false); await fetchCustomers() }
    else setFormError(res.error ?? 'Kuch masla hua')
    setFormLoading(false)
  }

  async function handleEdit(data: CustomerInput) {
    if (!editTarget) return
    setFormLoading(true)
    setFormError(null)
    const res = await api.updateCustomer(editTarget.id, data)
    if (res.success) { setEditTarget(null); await fetchCustomers() }
    else setFormError(res.error ?? 'Update nahi hua')
    setFormLoading(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setFormLoading(true)
    const res = await api.deleteCustomer(deleteTarget.id)
    if (res.success) { setDeleteTarget(null); await fetchCustomers() }
    setFormLoading(false)
  }

  function openCreate() { setFormError(null); setCreateOpen(true) }
  function openEdit(c: Customer) { setFormError(null); setEditTarget(c) }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">👥 Grahak (Customers)</h2>
          <p className="text-sm text-slate-500 mt-1">{customers.length} grahak registered hain</p>
        </div>
        <button
          id="btn-add-customer"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          + Naya Grahak
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <input
          id="input-search-customers"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Naam ya phone se dhundho..."
          className="flex-1 min-w-48 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {(['ALL', 'RESTAURANT', 'RETAIL'] as FilterType[]).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
              typeFilter === t
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {t === 'ALL' ? 'Sab' : t === 'RESTAURANT' ? '🍽 Restaurant' : '🛒 Retail'}
          </button>
        ))}
      </div>

      {/* Table / States */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : fetchError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          ⚠ {fetchError} —{' '}
          <button onClick={fetchCustomers} className="underline cursor-pointer font-bold">
            Dobara try karo
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="👥"
          title={search || typeFilter !== 'ALL' ? 'Koi nahi mila' : 'Abhi koi grahak nahi hai'}
          description={search || typeFilter !== 'ALL' ? 'Filter ya search change karo' : 'Pehla grahak add karo'}
          action={
            !search && typeFilter === 'ALL' ? (
              <button
                onClick={openCreate}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                + Naya Grahak
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
                  {['Naam', 'Qisam', 'Phone', 'Udhaar Baqi', ''].map(h => (
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
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-4">
                      <Badge variant={c.type.toLowerCase() as 'restaurant' | 'retail'} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{c.phone ?? '—'}</td>
                    <td className="px-4 py-4 font-bold">
                      <span className={c.totalUdhaar > 0 ? 'text-red-600' : 'text-slate-900'}>
                        Rs. {c.totalUdhaar.toLocaleString('en-PK')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(c)}
                          title="Edit karo"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                        >
                          ✏ Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          title="Hata do"
                          className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 active:scale-[0.98] cursor-pointer"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Naya Grahak Banao">
        <CustomerForm
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel="Banao"
          isLoading={formLoading}
          serverError={formError}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Grahak Badlo">
        {editTarget && (
          <CustomerForm
            initial={{ name: editTarget.name, type: editTarget.type, phone: editTarget.phone ?? '', address: editTarget.address ?? '' }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Save Karo"
            isLoading={formLoading}
            serverError={formError}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Pakka Hatana Hai?">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-slate-600 text-sm m-0">
              <strong className="text-slate-900">{deleteTarget.name}</strong> ko hata doge? Yeh action undo nahi hoga.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
              >
                Nahi
              </button>
              <button
                onClick={handleDelete}
                disabled={formLoading}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {formLoading ? '...' : 'Haan, Hatao'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-100 last:border-b-0">
          {[200, 100, 120, 80].map((w, j) => (
            <div
              key={j}
              className="h-4 rounded bg-slate-200 animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
