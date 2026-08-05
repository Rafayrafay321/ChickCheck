import { apiClient } from '@/shared/api/apiClient'
import type { ProductInput, StockEntryInput } from '@/shared/types'

export interface Product {
  id: string
  name: string
  nameUrdu: string | null
  unit: 'kg' | 'piece'
  pricePerUnit: number
  isActive: boolean
}

export interface ProductWithStock extends Product {
  currentStock: number
}

export interface StockEntry {
  id: string
  productId: string
  type: 'IN' | 'OUT'
  quantity: number
  note: string | null
  createdAt: string
}

export const inventoryApi = {
  getProducts: (): Promise<ProductWithStock[]> => 
    apiClient<ProductWithStock[]>('/api/products'),

  createProduct: (data: ProductInput): Promise<Product> =>
    apiClient<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: ({ id, data }: { id: string; data: Partial<ProductInput> }): Promise<Product> =>
    apiClient<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getStockSummary: (): Promise<ProductWithStock[]> =>
    apiClient<ProductWithStock[]>('/api/stock'),

  addStockEntry: (data: StockEntryInput): Promise<StockEntry> =>
    apiClient<StockEntry>('/api/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStockHistory: (productId: string): Promise<StockEntry[]> =>
    apiClient<StockEntry[]>(`/api/stock/${productId}`),
}
