'use client'

import { Modal } from '@/components/ui/Modal'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import type { ExpenseInput } from '@/shared/types'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: ExpenseInput) => Promise<{ success: boolean; error?: string }>
}

export function ExpenseModal({ isOpen, onClose, onSubmit }: ExpenseModalProps) {
  const handleSubmit = async (input: ExpenseInput) => {
    const res = await onSubmit(input)
    if (res.success) {
      onClose()
    }
    return res
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💸 Daily Expense Entry">
      <ExpenseForm onSubmit={handleSubmit} onCancel={onClose} />
    </Modal>
  )
}
