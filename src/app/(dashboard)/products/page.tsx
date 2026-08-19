'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProductTable } from '@/components/products/ProductTable'
import { ProductForm } from '@/components/products/ProductForm'
import { Product, EMPTY_PRODUCT_FORM } from '@/components/products/types'
import type { ProductInput } from '@/shared/types'

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
    (p) =>p.name.toLowerCase().includes(search.toLowerCase()) ||
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
      {/* Reusable Page Header */}
      <PageHeader
        title="Maal (Products)"
        subtitle={`${products.length} products dukan mein active hain`}
        actionLabel="Naya Maal"
        onAction={() => {
          setFormError(null)
          setCreateOpen(true)
        }}
      />

      {/* Search Bar */}
      <div className="max-w-xs">
        <input
          id="input-search-products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Naam se dhundho..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Table / States */}
      {isLoading ? (
        <LoadingSkeleton cols={6} />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchProducts} />
      ) : filtered.length === 0 ? (
        <EmptyState
          
          title={search ? 'Koi nahi mila' : 'Abhi koi maal nahi hai'}
          description={search ? 'Search clear karo' : 'Pehla product add karo — jaise Whole Chicken, Boneless, Wings'}
        />
      ) : (
        <ProductTable
          products={filtered}
          onEdit={(p) => {
            setFormError(null)
            setEditTarget(p)
          }}
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Naya Maal Banao">
        <ProductForm
          initial={EMPTY_PRODUCT_FORM}
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
