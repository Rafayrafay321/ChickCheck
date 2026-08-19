'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { ProductStock } from '@/app/(dashboard)/stock/types'

interface AddStockModalProps {
  isOpen: boolean
  onClose: () => void
  stock: ProductStock[]
  onSubmit: (productId: string, quantity: number, note: string) => Promise<void>
  formLoading: boolean
  formError: string | null
}

export function AddStockModal({
  isOpen,
  onClose,
  stock,
  onSubmit,
  formLoading,
  formError: serverError,
}: AddStockModalProps) {
  const [formProduct, setFormProduct] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formNote, setFormNote] = useState('Subah ki delivery')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (stock.length > 0) {
        setFormProduct(stock[0].id)
      } else {
        setFormProduct('')
      }
      setFormQuantity('')
      setFormNote('Subah ki delivery')
      setLocalError(null)
    }
  }, [isOpen, stock])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)

    if (!formProduct) {
      setLocalError('Product zaroor select karo')
      return
    }
    if (!formQuantity || Number(formQuantity) <= 0) {
      setLocalError('Wazan sahi daalo')
      return
    }

    await onSubmit(formProduct, Number(formQuantity), formNote.trim())
  }

  const displayError = localError || serverError

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Daalo (IN)">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Dropdown Menu of Products / Stock */}
        <FormField
          label="Kaunsa Maal Aya Hai? (Select Product)"
          as="select"
          required
          value={formProduct}
          onChange={(e) => setFormProduct(e.target.value)}
        >
          {stock.length === 0 ? (
            <option value="" disabled>
  Koi product nahi mila
            </option>
          ) : null}
          {stock.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''}
            </option>
          ))}
        </FormField>

        <FormField
          label="Kitna Wazan/Adad aya? (Quantity)"
          required
          type="number"
          min="0.1"
          step="0.1"
          placeholder="e.g. 50"
          value={formQuantity}
          onChange={(e) => setFormQuantity(e.target.value)}
          autoFocus
        />

        <FormField
          label="Koi Note? (Optional)"
          type="text"
          placeholder="e.g. Subah ki delivery, Vendor name..."
          value={formNote}
          onChange={(e) => setFormNote(e.target.value)}
        />

        {displayError && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
            {displayError}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={formLoading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
  Cancel</button>
          <button
            type="submit"
            disabled={formLoading || stock.length === 0}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11"
          >
            {formLoading ? 'Daal rahey hain...' : 'Save Karo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
