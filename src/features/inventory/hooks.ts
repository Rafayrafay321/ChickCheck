import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from './api'
import type { ProductInput, StockEntryInput } from '@/shared/types'
import type { ApiError } from '@/shared/api/errors'

// QUERY KEYS
export const inventoryKeys = {
  all: ['inventory'] as const,
  products: () => [...inventoryKeys.all, 'products'] as const,
  stockSummary: () => [...inventoryKeys.all, 'stockSummary'] as const,
  stockHistory: (productId: string) => [...inventoryKeys.all, 'stockHistory', productId] as const,
}

// HOOKS

export function useGetProducts() {
  return useQuery({
    queryKey: inventoryKeys.products(),
    queryFn: inventoryApi.getProducts,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() })
    },
  })
}

export function useGetStockSummary() {
  return useQuery({
    queryKey: inventoryKeys.stockSummary(),
    queryFn: inventoryApi.getStockSummary,
  })
}

export function useAddStockEntry() {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, StockEntryInput>({
    mutationFn: inventoryApi.addStockEntry,
    onSuccess: (_, variables) => {
      // Invalidate both summary and specific product history
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockSummary() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockHistory(variables.productId) })
    },
  })
}
