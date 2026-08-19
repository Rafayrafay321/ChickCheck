'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '@/lib/api-client'
import type { SupplierPurchaseInput } from '@/shared/types'

export interface SupplierPurchaseData {
  id: string
  supplierName: string
  grossWeight: number
  dudWeight: number
  netWeight: number
  ratePerKg: number
  totalAmount: number
  cashPaid: number
  purchaseDate: string
}

export function useSupplierPurchases(filters?: { date?: string; all?: boolean }) {
  const [purchases, setPurchases] = useState<SupplierPurchaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getPurchases(filters?.date, filters?.all)
      if (res.success && Array.isArray(res.data)) {
        setPurchases(res.data as SupplierPurchaseData[])
      } else {
        setPurchases([])
      }
    } catch {
      setError('Purchases fetch karne mein masla hua')
    } finally {
      setLoading(false)
    }
  }, [filters?.date, filters?.all])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  const createPurchase = async (input: SupplierPurchaseInput | SupplierPurchaseInput[]) => {
    try {
      setError(null)
      const res = Array.isArray(input)
        ? await api.createPurchasesBatch({ items: input })
        : await api.createPurchase(input)

      if (res.success && res.data) {
        await fetchPurchases()
        return { success: true, data: res.data }
      } else {
        const err = res.error || 'Purchase save fail hua'
        setError(err)
        return { success: false, error: err }
      }
    } catch {
      const err = 'Network connection error'
      setError(err)
      return { success: false, error: err }
    }
  }

  const createBatchPurchases = async (items: SupplierPurchaseInput[]) => {
    return createPurchase(items)
  }

  const { totalPurchasedKg, totalPurchasesCost } = useMemo(() => {
    return purchases.reduce(
      (acc, p) => ({
        totalPurchasedKg: acc.totalPurchasedKg + p.netWeight,
        totalPurchasesCost: acc.totalPurchasesCost + p.totalAmount,
      }),
      { totalPurchasedKg: 0, totalPurchasesCost: 0 }
    )
  }, [purchases])

  return {
    purchases,
    totalPurchasedKg,
    totalPurchasesCost,
    loading,
    error,
    refetch: fetchPurchases,
    createPurchase,
    createBatchPurchases,
  }
}
