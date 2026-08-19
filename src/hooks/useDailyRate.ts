'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'

export interface DailyRateData {
  id: string
  farmRate: number
  supplierPremium: number
  supplyRate: number
}

export function useDailyRate() {
  const [dailyRate, setDailyRate] = useState<DailyRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDailyRate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getDailyRate()
      if (res.success && res.data) {
        setDailyRate(res.data as DailyRateData)
      } else {
        setDailyRate(null)
      }
    } catch {
      setError('Rate fetch karne mein masla hua')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDailyRate()
  }, [fetchDailyRate])

  const updateDailyRate = async (farmRate: number, supplierPremium: number = 4) => {
    try {
      setError(null)
      const res = await api.updateDailyRate(farmRate, supplierPremium)
      if (res.success && res.data) {
        setDailyRate(res.data as DailyRateData)
        return { success: true, data: res.data as DailyRateData }
      } else {
        const err = res.error || 'Rate update fail hua'
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
    dailyRate,
    loading,
    error,
    refetch: fetchDailyRate,
    updateDailyRate,
  }
}
