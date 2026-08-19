'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import type { Customer } from './types'

export interface DeleteCustomerModalProps {
  customer: Customer | null
  onClose: () => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export function DeleteCustomerModal({
  customer,
  onClose,
  onConfirm,
  isLoading,
}: DeleteCustomerModalProps) {
  if (!customer) return null

  return (
    <Modal isOpen={!!customer} onClose={onClose} title="Pakka Hatana Hai?">
      <div className="flex flex-col gap-4">
        <p className="text-slate-600 text-sm m-0">
          <strong className="text-slate-900">{customer.name}</strong> ko hata doge? Yeh action undo nahi hoga.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
          >
  Nahi</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isLoading ? '...' : 'Haan, Hatao'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
