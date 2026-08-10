'use client'

import { Modal } from '@/components/ui/Modal'
import { SupplierPurchaseForm } from '@/components/stock/SupplierPurchaseForm'
import type { SupplierPurchaseInput } from '@/shared/types'

interface SupplierPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: SupplierPurchaseInput) => Promise<{ success: boolean; error?: string }>
}

export function SupplierPurchaseModal({ isOpen, onClose, onSubmit }: SupplierPurchaseModalProps) {
  const handleSubmit = async (input: SupplierPurchaseInput) => {
    const res = await onSubmit(input)
    if (res.success) {
      onClose()
    }
    return res
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🚚 Live Hen Purchasing Entry">
      <SupplierPurchaseForm onSubmit={handleSubmit} onCancel={onClose} />
    </Modal>
  )
}
