'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'

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
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load products for the dropdown
      fetch('/api/products')
        .then((r) => r.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setProducts(json.data)
            if (json.data.length > 0) setProductId(json.data[0].id)
          }
        })
        .catch(() => {})

      // Reset form
      setIsLiveHen(false)
      setSupplierName('')
      setQuantity('')
      setCostPerKg('')
      setNote('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  const qty = parseFloat(quantity) || 0
  const rate = parseFloat(costPerKg) || 0
  const totalCost = qty * rate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isLiveHen && !productId) { setError('Product zaroor select karein'); return }
    if (qty <= 0) { setError('Quantity sahi daalein (> 0 kg)'); return }
    if (rate <= 0) { setError('Purchase Rate daalein (Rs/kg)'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/emergency-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLiveHen, productId: isLiveHen ? null : productId, supplierName, quantity: qty, costPerKg: rate, note }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(true)
        onSuccess()
        setTimeout(() => { setSuccess(false); onClose() }, 1200)
      } else {
        setError(json.error || 'Save nahi hua')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === productId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ Shortfall / Emergency Kharid">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type Toggle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Kaunsa Maal Khareeda?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: '🍗 Ready-Cut Maal', sub: 'Boneless, Kaleji, Pota, Wings etc.' },
              { value: true, label: '🐔 Zinda Murgi', sub: 'Live Hen from outside' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setIsLiveHen(opt.value)}
                className={`p-3 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all ${
                  isLiveHen === opt.value
                    ? 'bg-orange-50 border-orange-400 text-orange-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div>{opt.label}</div>
                <div className="font-normal text-[11px] mt-0.5 opacity-70">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Product dropdown (only for ready-cut) */}
        {!isLiveHen && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Product (Kaunsa Cut?)
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity + Rate grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Quantity (Kg)
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="e.g. 5.0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Purchase Rate (Rs/kg)
            </label>
            <input
              type="number"
              step="1"
              required
              placeholder="e.g. 650"
              value={costPerKg}
              onChange={(e) => setCostPerKg(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Cost summary */}
        {qty > 0 && rate > 0 && (
          <div className="p-3.5 rounded-lg bg-orange-50 border border-orange-200 flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-orange-700">
                {isLiveHen ? 'Zinda Murgi' : selectedProduct?.name ?? 'Product'}:
              </span>
              <span className="font-semibold text-orange-900">{qty} kg @ Rs {rate}/kg</span>
            </div>
            <div className="flex justify-between border-t border-orange-200 pt-1.5 mt-0.5">
              <span className="font-bold text-orange-800">Total Cost (Aapka Kharcha):</span>
              <strong className="text-orange-700 text-sm">Rs {totalCost.toLocaleString()}</strong>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Supplier / Dukaan ka Naam (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Bilal Chicken Shop, Kamran..."
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Boneless khatam ho gaya tha, urgent order..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">⚠ {error}</div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">✅ Emergency purchase save ho gaya!</div>
        )}

        <div className="flex gap-3 justify-end mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-11"
          >
            {submitting ? 'Saving...' : '⚡ Save Emergency Purchase'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
