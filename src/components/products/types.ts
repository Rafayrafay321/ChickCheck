import type { ProductInput } from '@/shared/types'

export interface Product {
  id: string
  name: string
  nameUrdu: string | null
  unit: 'kg' | 'piece'
  pricingType: 'MULTIPLIER' | 'FIXED'
  defaultMultiplier: number | null
  pricePerUnit: number
  isByproduct: boolean
  isActive: boolean
  createdAt: string
}

export const EMPTY_PRODUCT_FORM: ProductInput = {
  name: '',
  nameUrdu: '',
  unit: 'kg',
  pricingType: 'MULTIPLIER',
  defaultMultiplier: 1.5,
  pricePerUnit: 0,
  isByproduct: false,
}
