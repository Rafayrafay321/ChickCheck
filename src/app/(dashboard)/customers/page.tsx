'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { CustomerTable } from '@/components/customers/CustomerTable'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { DeleteCustomerModal } from '@/components/customers/DeleteCustomerModal'
import { Customer, CustomerFilterType, EMPTY_CUSTOMER_FORM } from '@/components/customers/types'
import type { CustomerInput } from '@/shared/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CustomerFilterType>('ALL')

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

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? '').includes(search)
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter
    return matchesSearch && matchesType
  })

  async function handleCreate(data: CustomerInput) {
    setFormLoading(true)
    setFormError(null)
    const res = await api.createCustomer(data)
    if (res.success) {
      setCreateOpen(false)
      await fetchCustomers()
    } else {
      setFormError(res.error ?? 'Kuch masla hua')
    }
    setFormLoading(false)
  }

  async function handleEdit(data: CustomerInput) {
    if (!editTarget) return
    setFormLoading(true)
    setFormError(null)
    const res = await api.updateCustomer(editTarget.id, data)
    if (res.success) {
      setEditTarget(null)
      await fetchCustomers()
    } else {
      setFormError(res.error ?? 'Update nahi hua')
    }
    setFormLoading(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setFormLoading(true)
    const res = await api.deleteCustomer(deleteTarget.id)
    if (res.success) {
      setDeleteTarget(null)
      await fetchCustomers()
    }
    setFormLoading(false)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="Grahak (Customers)"
        subtitle={`${customers.length} grahak registered hain`}
        actionLabel="Naya Grahak"
        onAction={() => {
          setFormError(null)
          setCreateOpen(true)
        }}
      />

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap items-center p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <input
          id="input-search-customers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Naam ya phone se dhundho..."
          className="flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />

        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/60">
          {(['ALL', 'RESTAURANT', 'RETAIL'] as CustomerFilterType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'ALL' ? 'Sab' : t === 'RESTAURANT' ? ' Hotel' : ' Retail'}
            </button>
          ))}
        </div>
      </div>

      {/* Table / States */}
      {isLoading ? (
        <LoadingSkeleton cols={5} />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchCustomers} />
      ) : filtered.length === 0 ? (
        <EmptyState
          
          title={search || typeFilter !== 'ALL' ? 'Koi nahi mila' : 'Abhi koi grahak nahi hai'}
          description={
            search || typeFilter !== 'ALL'
              ? 'Filter ya search change karo'
              : 'Pehla grahak add karo'
          }
        />
      ) : (
        <CustomerTable
          customers={filtered}
          onEdit={(c) => {
            setFormError(null)
            setEditTarget(c)
          }}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Naya Grahak Banao">
        <CustomerForm
          initial={EMPTY_CUSTOMER_FORM}
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
            initial={{
              name: editTarget.name,
              type: editTarget.type,
              phone: editTarget.phone ?? '',
              address: editTarget.address ?? '',
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Save Karo"
            isLoading={formLoading}
            serverError={formError}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteCustomerModal
        customer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={formLoading}
      />
    </div>
  )
}
