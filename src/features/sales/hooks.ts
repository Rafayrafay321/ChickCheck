import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from './api'
import type { CreateOrderInput, OrderFilters } from '@/shared/types'
import type { ApiError } from '@/shared/api/errors'

// QUERY KEYS
export const salesKeys = {
  all: ['sales'] as const,
  orders: (filters?: OrderFilters) => [...salesKeys.all, 'orders', filters] as const,
}

// HOOKS

export function useGetOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: salesKeys.orders(filters),
    queryFn: () => salesApi.getOrders(filters),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, CreateOrderInput>({
    mutationFn: salesApi.createOrder,
    onSuccess: () => {
      // Invalidate all order queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: salesKeys.all })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, { id: string; status: string }>({
    mutationFn: salesApi.updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all })
    },
  })
}
