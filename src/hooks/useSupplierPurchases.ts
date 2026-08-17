'use client'

import { useState, useEffect, useCallback } from 'react'
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
      const params = new URLSearchParams()
      if (filters?.date) params.set('date', filters.date)
      if (filters?.all) params.set('all', 'true')

      const res = await fetch(`/api/purchases?${params.toString()}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setPurchases(json.data)
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

  const createPurchase = async (input: SupplierPurchaseInput) => {
    try {
      setError(null)
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (json.success && json.data) {
        await fetchPurchases()
        return { success: true, data: json.data }
      } else {
        const err = json.error || 'Purchase save fail hua'
        setError(err)
        return { success: false, error: err }
      }
    } catch {
      const err = 'Network connection error'
      setError(err)
      return { success: false, error: err }
    }
  }

  const totalPurchasedKg = purchases.reduce((sum, p) => sum + p.netWeight, 0)
  const totalPurchasesCost = purchases.reduce((sum, p) => sum + p.totalAmount, 0)

  return {
    purchases,
    totalPurchasedKg,
    totalPurchasesCost,
    loading,
    error,
    refetch: fetchPurchases,
    createPurchase,
  }
}
