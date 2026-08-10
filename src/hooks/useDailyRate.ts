'use client'

import { useState, useEffect, useCallback } from 'react'

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
      const res = await fetch('/api/daily-rate')
      const json = await res.json()
      if (json.success && json.data) {
        setDailyRate(json.data)
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
      const res = await fetch('/api/daily-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmRate, supplierPremium }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setDailyRate(json.data)
        return { success: true, data: json.data }
      } else {
        const err = json.error || 'Rate update fail hua'
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
