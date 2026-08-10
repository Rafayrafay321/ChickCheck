'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { useDailyRate } from '@/hooks/useDailyRate'

interface Customer {
  id: string
  name: string
  type: string
}

interface Product {
  id: string
  name: string
  nameUrdu: string | null
  unit: string
  pricingType?: 'MULTIPLIER' | 'FIXED'
  defaultMultiplier?: number | null
  pricePerUnit: number
}

interface CustomerMultiplier {
  productId: string
  multiplier: number
}

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  customers: Customer[]
  products: Product[]
  onSubmit: (customerId: string, note: string, items: Array<{ productId: string; quantity: number }>) => Promise<void>
  formLoading: boolean
  formError: string | null
}

export function CreateOrderModal({ isOpen, onClose, customers, products, onSubmit, formLoading, formError: serverError }: CreateOrderModalProps) {
  const { dailyRate } = useDailyRate()
  const [customerId, setCustomerId] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; quantity: string }>>([])
  const [customerMultipliers, setCustomerMultipliers] = useState<CustomerMultiplier[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCustomerId('')
      setNote('')
      setItems([{ productId: '', quantity: '' }])
      setCustomerMultipliers([])
      setLocalError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (customerId) {
      fetch(`/api/customer-multipliers?customerId=${customerId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setCustomerMultipliers(json.data)
          } else {
            setCustomerMultipliers([])
          }
        })
        .catch(() => setCustomerMultipliers([]))
    }
  }, [customerId])

  function handleAddItem() {
    setItems([...items, { productId: '', quantity: '' }])
  }

  function handleRemoveItem(index: number) {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  function handleItemChange(index: number, field: 'productId' | 'quantity', value: string) {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  function getItemUnitPrice(productId: string): number {
    const p = products.find((prod) => prod.id === productId)
    if (!p) return 0

    if (p.pricingType === 'MULTIPLIER') {
      const supplyRate = dailyRate?.supplyRate || 0
      const customOverride = customerMultipliers.find((m) => m.productId === productId)
      const multiplier = customOverride?.multiplier ?? p.defaultMultiplier ?? 1.0
      return Math.round(supplyRate * multiplier)
    }

    return p.pricePerUnit
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)

    if (!customerId) {
      setLocalError('Customer zaroor select karein')
      return
    }
    if (items.length === 0) {
      setLocalError('Kam az kam ek product add karein')
      return
    }

    const cleanedItems: Array<{ productId: string; quantity: number }> = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.productId) {
        setLocalError(`Item ${i + 1} ka product select karein`)
        return
      }
      const qty = Number(item.quantity)
      if (!item.quantity || isNaN(qty) || qty <= 0) {
        setLocalError(`Item ${i + 1} ki quantity sahi daalein`)
        return
      }
      cleanedItems.push({ productId: item.productId, quantity: qty })
    }

    await onSubmit(customerId, note.trim(), cleanedItems)
  }

  let liveTotal = 0
  items.forEach((item) => {
    if (item.productId && item.quantity && !isNaN(Number(item.quantity))) {
      const unitPrice = getItemUnitPrice(item.productId)
      liveTotal += unitPrice * Number(item.quantity)
    }
  })

  const displayError = localError || serverError

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Naya Order Banao (POS)">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!dailyRate && (
          <div className="p-3 bg-amber-500/15 text-amber-500 rounded-lg text-xs font-medium border border-amber-500/30">
            ⚠️ <strong>Aaj ka Farm Rate Missing hai!</strong> Multiplier rate calculate karne ke liye pehle top bar se Farm Rate daalein.
          </div>
        )}

        {/* Step 1: Customer */}
        <div className="bg-bg p-4 rounded-lg border border-border">
          <h4 className="m-0 mb-3 text-sm font-semibold text-text-primary">1. Customer Chuno</h4>
          <FormField
            label="Customer"
            as="select"
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="" disabled>Select karein...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </FormField>
        </div>

        {/* Step 2: Items */}
        <div className="bg-bg p-4 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-3">
            <h4 className="m-0 text-sm font-semibold text-text-primary">2. Items (Maal)</h4>
          </div>

          {items.map((item, index) => {
            const calculatedPrice = item.productId ? getItemUnitPrice(item.productId) : 0
            return (
              <div key={index} className="flex gap-3 items-start mb-3 pb-3 border-b border-dashed border-border last:border-b-0 last:pb-0 last:mb-0">
                <div className="flex-2">
                  <FormField
                    label={index === 0 ? 'Product' : undefined}
                    as="select"
                    required
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  >
                    <option value="" disabled>Chuno...</option>
                    {products.map((p) => {
                      const price = getItemUnitPrice(p.id)
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''} — Rs. {price}/{p.unit}
                        </option>
                      )
                    })}
                  </FormField>
                </div>
                <div className="flex-1">
                  <FormField
                    label={index === 0 ? 'Qty (Kg)' : undefined}
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="0.0"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </div>
                {item.productId && (
                  <div className={`text-xs font-semibold text-green-500 min-w-[70px] text-right ${index === 0 ? 'mt-7' : 'mt-2'}`}>
                    Rs. {(calculatedPrice * (Number(item.quantity) || 0)).toLocaleString()}
                  </div>
                )}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className={`px-3 py-2 bg-red-500/15 text-red-500 rounded-md font-bold cursor-pointer hover:bg-red-500/20 transition-colors ${index === 0 ? 'mt-7' : 'mt-1'}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-500/15 text-blue-500 rounded-md cursor-pointer hover:bg-blue-500/20 transition-colors mt-2"
          >
            + Ek Aur Item Daalein
          </button>
        </div>

        {/* Total & Note */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between p-4 bg-green-500/15 rounded-lg border border-green-500/30">
            <span className="font-semibold text-green-500">Total Bill (Calculated Rate):</span>
            <span className="font-bold text-xl text-green-500">Rs. {liveTotal.toLocaleString('en-PK')}</span>
          </div>

          <FormField
            label="Koi Note? (Optional)"
            type="text"
            placeholder="e.g. Shaam ko delivery, Special packing..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {displayError && (
          <div className="p-3 bg-red-500/15 text-red-500 rounded-lg text-xs font-medium">
            ⚠ {displayError}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={formLoading}
            className="py-2.5 px-4 rounded-lg cursor-pointer border border-border bg-transparent text-text-secondary hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formLoading || !dailyRate}
            className="py-2.5 px-4 rounded-lg cursor-pointer border-none bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {formLoading ? 'Ban raha hai...' : 'Order Confirm Karein'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
