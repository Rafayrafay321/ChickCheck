import { apiClient } from '@/shared/api/apiClient'
import type { CreateOrderInput, OrderFilters } from '@/shared/types'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Order {
  id: string
  customerId: string
  orderDate: string
  status: string
  totalAmount: number
  note: string | null
  items: OrderItem[]
}

export const salesApi = {
  getOrders: (filters?: OrderFilters): Promise<Order[]> => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.customerId) params.set('customerId', filters.customerId)
    const qs = params.toString()
    return apiClient<Order[]>(`/api/orders${qs ? `?${qs}` : ''}`)
  },

  createOrder: (data: CreateOrderInput): Promise<Order> =>
    apiClient<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrderStatus: ({ id, status }: { id: string; status: string }): Promise<void> =>
    apiClient<void>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  cancelOrder: (id: string): Promise<void> =>
    apiClient<void>(`/api/orders/${id}/cancel`, {
      method: 'PATCH',
    }),
}
