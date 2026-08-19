'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { SupplierTable } from '@/components/suppliers/SupplierTable'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { RecordSupplierPaymentModal } from '@/components/suppliers/RecordSupplierPaymentModal'
import { SupplierLedgerModal } from '@/components/suppliers/SupplierLedgerModal'
import { Supplier, SupplierFormValues, EMPTY_SUPPLIER_FORM } from '@/components/suppliers/types'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ALL'>('ACTIVE')

  // Modals state
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [payTarget, setPayTarget] = useState<Supplier | null>(null)
  const [ledgerTarget, setLedgerTarget] = useState<Supplier | null>(null)

  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    const res = await api.getSuppliers(undefined, activeTab === 'ACTIVE')
    if (res.success && Array.isArray(res.data)) {
      setSuppliers(res.data as Supplier[])
    } else {
      setFetchError(res.error ?? 'Suppliers load nahi ho sake')
    }
    setIsLoading(false)
  }, [activeTab])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const filtered = suppliers.filter(
    (s) =>s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? '').includes(search) ||
      (s.address ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPayableAll = suppliers.reduce((sum, s) => sum + s.totalPayable, 0)
  const suppliersWithBalance = suppliers.filter((s) => s.totalPayable > 0).length

  async function handleCreate(data: SupplierFormValues) {
    setFormLoading(true)
    setFormError(null)
    const res = await api.createSupplier(data)
    if (res.success) {
      setCreateOpen(false)
      await fetchSuppliers()
    } else {
      setFormError(res.error ?? 'Supplier add nahi ho saka')
    }
    setFormLoading(false)
  }

  async function handleEdit(data: SupplierFormValues) {
    if (!editTarget) return
    setFormLoading(true)
    setFormError(null)
    const res = await api.updateSupplier(editTarget.id, data)
    if (res.success) {
      setEditTarget(null)
      await fetchSuppliers()
    } else {
      setFormError(res.error ?? 'Update nahi hua')
    }
    setFormLoading(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setFormLoading(true)
    const res = await api.deleteSupplier(deleteTarget.id)
    if (res.success) {
      setDeleteTarget(null)
      await fetchSuppliers()
    }
    setFormLoading(false)
  }

  async function handleRecordPayment(data: {
    supplierId: string
    amount: number
    method: string
    note?: string
  }) {
    const res = await api.recordSupplierPayment(data)
    if (res.success) {
      await fetchSuppliers()
      return { success: true }
    }
    return { success: false, error: res.error || 'Payment save nahi hui' }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} Suppliers registered hai`}
        actionLabel="Naya Supplier"
        onAction={() => {
          setFormError(null)
          setCreateOpen(true)
        }}
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Registered Suppliers
          </span>
          <span className="text-xl font-bold text-slate-900">{suppliers.length}</span>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block mb-1">Total Payable
          </span>
          <span className="text-xl font-bold text-red-700">Rs {totalPayableAll.toLocaleString('en-PK')}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 flex-wrap items-center p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <input
          id="input-search-suppliers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Supplier naam, phone ya location se dhundho..."
          className="flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />

        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >Active Suppliers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >Tamam (All)
          </button>
        </div>
      </div>

      {/* Table / Loading / States */}
      {isLoading ? (
        <LoadingSkeleton cols={5} />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchSuppliers} />
      ) : filtered.length === 0 ? (
        <EmptyState
          
          title={search ? 'Koi Supplier Nahi Mila' : 'Abhi koi supplier add nahi hai'}
          description={
            search
              ? 'Search change ya clear karo'
              : 'Pehla supplier add karo jaise Haji Shabeen, Faisal Broiler waghera'
          }
        />
      ) : (
        <SupplierTable
          suppliers={filtered}
          onPay={(s) => setPayTarget(s)}
          onViewLedger={(s) => setLedgerTarget(s)}
          onEdit={(s) => {
            setFormError(null)
            setEditTarget(s)
          }}
          onDelete={(s) => setDeleteTarget(s)}
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Naya Supplier Banao">
        <SupplierForm
          initial={EMPTY_SUPPLIER_FORM}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel="Banao"
          isLoading={formLoading}
          serverError={formError}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Supplier Edit Karo">
        {editTarget && (
          <SupplierForm
            initial={{
              name: editTarget.name,
              phone: editTarget.phone ?? '',
              address: editTarget.address ?? '',
              ratePremium: editTarget.ratePremium ?? 4,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Save Karo"
            isLoading={formLoading}
            serverError={formError}
          />
        )}
      </Modal>

      {/* Delete / Deactivate Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supplier Deactivate Karo?">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-slate-600 text-sm m-0">
              <strong className="text-slate-900">{deleteTarget.name}</strong> ko deactivate karna chahte hain? Purana khata aur records mehfooz rahenge.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
              >Nahi</button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={formLoading}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {formLoading ? '...' : 'Haan, Deactivate Karo'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Modal */}
      <RecordSupplierPaymentModal
        supplier={payTarget}
        onClose={() => setPayTarget(null)}
        onSubmit={handleRecordPayment}
      />

      {/* Ledger Modal */}
      <SupplierLedgerModal
        supplier={ledgerTarget}
        onClose={() => setLedgerTarget(null)}
        onRecordPayment={(s) => setPayTarget(s)}
      />
    </div>
  )
}
