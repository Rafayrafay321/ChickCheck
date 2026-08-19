import type { CustomerInput } from '@/shared/types'

export interface Customer {
  id: string
  name: string
  type: 'RESTAURANT' | 'RETAIL'
  phone: string | null
  address: string | null
  totalUdhaar: number
  createdAt: string
}

export type CustomerFilterType = 'ALL' | 'RESTAURANT' | 'RETAIL'

export const EMPTY_CUSTOMER_FORM: CustomerInput = {
  name: '',
  type: 'RETAIL',
  phone: '',
  address: '',
}
