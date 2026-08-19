'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ProductStock } from '@/app/(dashboard)/stock/types'

interface AddStockModalProps {
  isOpen: boolean
  onClose: () => void
  stock: ProductStock[]
  onSubmit: (productId: string, quantity: number, note: string) => Promise<void>
  formLoading: boolean
  formError: string | null
}

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden'

export function AddStockModal({ isOpen, onClose, stock, onSubmit, formLoading, formError }: AddStockModalProps) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setProductId(stock.length > 0 ? stock[0].id : '')
      setQuantity('')
      setNote('')
      setLocalError(null)
    }
  }, [isOpen, stock])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!productId) { setLocalError('Product select karo'); return }
    if (!quantity || Number(quantity) <= 0) { setLocalError('Wazan daalo'); return }
    await onSubmit(productId, Number(quantity), note.trim())
  }

  const error = localError || formError

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Daalo">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{error}</div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Product</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required className={`${INPUT_CLASS} cursor-pointer`}>
            {stock.length === 0 && <option value="" disabled>Koi product nahi</option>}
            {stock.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Wazan / Qty</label>
            <input type="number" step="0.1" min="0.1" required placeholder="50" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Note (Optional)</label>
            <input type="text" placeholder="Detail..." value={note} onChange={(e) => setNote(e.target.value)} className={INPUT_CLASS} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} disabled={formLoading} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={formLoading || stock.length === 0} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50">
            {formLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
