'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api-client'

interface Product {
  id: string
  name: string
  nameUrdu: string | null
  unit: string
}

interface EmergencyPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden'

export function EmergencyPurchaseModal({ isOpen, onClose, onSuccess }: EmergencyPurchaseModalProps) {
  const [isLiveHen, setIsLiveHen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [costPerKg, setCostPerKg] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      api.getProducts().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const prods = res.data as Product[]
          setProducts(prods)
          if (prods.length > 0) setProductId(prods[0].id)
        }
      })
      setIsLiveHen(false)
      setSupplierName('')
      setQuantity('')
      setCostPerKg('')
      setNote('')
      setError(null)
    }
  }, [isOpen])

  const qty = parseFloat(quantity) || 0
  const rate = parseFloat(costPerKg) || 0
  const total = qty * rate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isLiveHen && !productId) { setError('Product select karein'); return }
    if (qty <= 0) { setError('Quantity daalein'); return }
    if (rate <= 0) { setError('Rate daalein'); return }

    setSubmitting(true)
    try {
      const res = await api.createEmergencyPurchase({
        isLiveHen,
        productId: isLiveHen ? undefined : productId,
        supplierName: supplierName || undefined,
        quantity: qty,
        costPerKg: rate,
        note: note || undefined,
      })
      if (res.success) {
        onSuccess()
        onClose()
      } else {
        setError(res.error || 'Save fail')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Emergency Kharid">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{error}</div>
        )}

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: false, label: 'Ready-Cut Maal' },
            { value: true, label: 'Zinda Murgi' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setIsLiveHen(opt.value)}
              className={`py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                isLiveHen === opt.value
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Product dropdown (ready-cut only) */}
        {!isLiveHen && (
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className={`${INPUT_CLASS} cursor-pointer`}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Qty, Rate, Supplier in a grid */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Qty (Kg)</label>
            <input type="number" step="0.1" required placeholder="5" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Rate/Kg</label>
            <input type="number" step="1" required placeholder="650" value={costPerKg} onChange={(e) => setCostPerKg(e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Supplier</label>
            <input type="text" placeholder="Optional" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className={INPUT_CLASS} />
          </div>
        </div>

        {/* Live total */}
        {total > 0 && (
          <div className="flex justify-between text-xs text-slate-500 px-1">
            <span>{qty} kg × Rs {rate}</span>
            <strong className="text-slate-900">Rs {total.toLocaleString('en-PK')}</strong>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Note (Optional)</label>
          <input type="text" placeholder="Detail..." value={note} onChange={(e) => setNote(e.target.value)} className={INPUT_CLASS} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
