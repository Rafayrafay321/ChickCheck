'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useDailyRate } from '@/hooks/useDailyRate'
import { api } from '@/lib/api-client'

interface Customer { id: string; name: string; type: string }
interface Product { id: string; name: string; nameUrdu: string | null; unit: string; pricingType?: 'MULTIPLIER' | 'FIXED'; defaultMultiplier?: number | null; pricePerUnit: number }
interface CustomerMultiplier { productId: string; multiplier: number }

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  customers: Customer[]
  products: Product[]
  onSubmit: (customerId: string, note: string, items: Array<{ productId: string; quantity: number }>) => Promise<void>
  formLoading: boolean
  formError: string | null
}

const INPUT_CLASS = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden'

export function CreateOrderModal({ isOpen, onClose, customers, products, onSubmit, formLoading, formError }: CreateOrderModalProps) {
  const { dailyRate } = useDailyRate()
  const [customerId, setCustomerId] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; quantity: string }>>([])
  const [multipliers, setMultipliers] = useState<CustomerMultiplier[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCustomerId('')
      setNote('')
      setItems([{ productId: '', quantity: '' }])
      setMultipliers([])
      setLocalError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (customerId) {
      api.getCustomerMultipliers(customerId)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) setMultipliers(res.data as CustomerMultiplier[])
          else setMultipliers([])
        })
        .catch(() => setMultipliers([]))
    }
  }, [customerId])

  function getPrice(productId: string): number {
    const p = products.find((x) => x.id === productId)
    if (!p) return 0
    if (p.pricingType === 'MULTIPLIER') {
      const rate = dailyRate?.supplyRate || 0
      const m = multipliers.find((x) => x.productId === productId)?.multiplier ?? p.defaultMultiplier ?? 1
      return Math.round(rate * m)
    }
    return p.pricePerUnit
  }

  function setItem(idx: number, field: 'productId' | 'quantity', value: string) {
    setItems((prev) => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next })
  }

  let total = 0
  items.forEach((it) => {
    if (it.productId && it.quantity) total += getPrice(it.productId) * (Number(it.quantity) || 0)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!customerId) { setLocalError('Customer select karein'); return }
    const cleaned: Array<{ productId: string; quantity: number }> = []
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) { setLocalError(`Item ${i + 1}: Product select karein`); return }
      const qty = Number(items[i].quantity)
      if (!qty || qty <= 0) { setLocalError(`Item ${i + 1}: Qty daalo`); return }
      cleaned.push({ productId: items[i].productId, quantity: qty })
    }
    await onSubmit(customerId, note.trim(), cleaned)
  }

  const error = localError || formError

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Naya Order">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">{error}</div>
        )}

        {!dailyRate && (
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
            Pehle Farm Rate set karein
          </div>
        )}

        {/* Customer */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className={`${INPUT_CLASS} cursor-pointer`}>
            <option value="" disabled>Select...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </select>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((item, idx) => {
            const price = item.productId ? getPrice(item.productId) : 0
            const lineTotal = price * (Number(item.quantity) || 0)
            return (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-[2]">
                  {idx === 0 && <label className="block text-[11px] font-medium text-slate-500 mb-1">Product</label>}
                  <select value={item.productId} onChange={(e) => setItem(idx, 'productId', e.target.value)} required className={`${INPUT_CLASS} cursor-pointer`}>
                    <option value="" disabled>Select...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — Rs {getPrice(p.id)}/{p.unit}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  {idx === 0 && <label className="block text-[11px] font-medium text-slate-500 mb-1">Qty</label>}
                  <input type="number" step="0.1" min="0.1" required placeholder="0" value={item.quantity} onChange={(e) => setItem(idx, 'quantity', e.target.value)} className={INPUT_CLASS} />
                </div>
                {item.productId && (
                  <span className="text-xs font-bold text-emerald-600 min-w-[60px] text-right pb-2">Rs {lineTotal.toLocaleString('en-PK')}</span>
                )}
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-xs font-bold pb-2 cursor-pointer">
                    ✕
                  </button>
                )}
              </div>
            )
          })}

          <button type="button" onClick={() => setItems((prev) => [...prev, { productId: '', quantity: '' }])} className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
            + Aur Item
          </button>
        </div>

        {/* Total + Note */}
        {total > 0 && (
          <div className="flex justify-between items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <span className="text-xs font-medium text-slate-500">Total</span>
            <strong className="text-sm text-slate-900">Rs {total.toLocaleString('en-PK')}</strong>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Note (Optional)</label>
          <input type="text" placeholder="Detail..." value={note} onChange={(e) => setNote(e.target.value)} className={INPUT_CLASS} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} disabled={formLoading} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={formLoading || !dailyRate} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50">
            {formLoading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
