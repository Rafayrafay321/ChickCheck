export interface Supplier {
  id: string
  name: string
  phone: string | null
  address: string | null
  ratePremium: number
  totalPayable: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    purchases: number
    payments: number
  }
}

export interface SupplierLedgerEntry {
  id: string
  date: string
  type: 'PURCHASE' | 'PAYMENT'
  description: string
  debit: number // We paid (decreases payable)
  credit: number // We bought (increases payable)
  runningBalance: number
  details: Record<string, unknown>
}

export interface SupplierLedgerData {
  supplier: Supplier
  calculatedTotalPayable: number
  totalPurchasesAmount: number
  totalPaymentsAmount: number
  entries: SupplierLedgerEntry[]
}

export interface SupplierFormValues {
  name: string
  phone?: string
  address?: string
  ratePremium?: number
}

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: '',
  phone: '',
  address: '',
  ratePremium: 4,
}
