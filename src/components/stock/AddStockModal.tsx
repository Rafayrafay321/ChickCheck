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

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px', fontSize: '0.875rem', fontWeight: 600,
  backgroundColor: 'var(--color-primary)', color: '#fff',
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  minHeight: '44px', transition: 'background-color 0.15s ease',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px', fontSize: '0.875rem', fontWeight: 600,
  backgroundColor: 'transparent', color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer',
  minHeight: '44px',
}

export function AddStockModal({ isOpen, onClose, stock, onSubmit, formLoading, formError: serverError }: AddStockModalProps) {
  const [formProduct, setFormProduct] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formNote, setFormNote] = useState('Subah ki delivery')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (!formProduct && stock.length > 0) {
        setFormProduct(stock[0].id)
      }
      setFormQuantity('')
      setFormNote('Subah ki delivery')
      setLocalError(null)
    }
  }, [isOpen, stock, formProduct])

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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField
          label="Kaunsa Maal Aya Hai?"
          as="select"
          required
          value={formProduct}
          onChange={e => setFormProduct(e.target.value)}
        >
          <option value="" disabled>Chuno...</option>
          {stock.map(p => (
            <option key={p.id} value={p.id}>{p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''}</option>
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
          onChange={e => setFormQuantity(e.target.value)}
          autoFocus
        />

        <FormField
          label="Koi Note? (Optional)"
          type="text"
          placeholder="e.g. Subah ki delivery, Vendor name..."
          value={formNote}
          onChange={e => setFormNote(e.target.value)}
        />

        {displayError && (
          <div style={{
            padding: '10px 14px', backgroundColor: '#FEE2E2', color: '#991B1B',
            borderRadius: '8px', fontSize: '0.85rem',
          }}>
            ⚠ {displayError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} disabled={formLoading} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={formLoading} style={primaryBtnStyle}>
            {formLoading ? 'Daal rahey hain...' : 'Save Karo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
