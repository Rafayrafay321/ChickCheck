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

export function useSupplierPurchases() {
  const [purchases, setPurchases] = useState<SupplierPurchaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/purchases')
      const json = await res.json()
      if (json.success && json.data) {
        setPurchases(json.data)
      } else {
        setPurchases([])
      }
    } catch {
      setError('Purchases fetch karne mein masla hua')
    } finally {
      setLoading(false)
    }
  }, [])

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
        setPurchases((prev) => [json.data, ...prev])
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

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchases,
    createPurchase,
  }
}
