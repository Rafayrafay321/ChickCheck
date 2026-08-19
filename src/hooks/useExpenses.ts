'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '@/lib/api-client'
import type { ExpenseInput } from '@/shared/types'

export interface ExpenseData {
  id: string
  category: 'PETROL' | 'BAGS' | 'BIKE' | 'PUNCHER' | 'POLICE' | 'LUNCH' | 'WAGES' | 'OTHER'
  amount: number
  note: string | null
  date: string
  createdAt: string
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getExpenses()
      if (res.success && Array.isArray(res.data)) {
        setExpenses(res.data as ExpenseData[])
      } else {
        setExpenses([])
      }
    } catch {
      setError('Expenses fetch karne mein masla hua')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const createExpense = async (input: ExpenseInput) => {
    try {
      setError(null)
      const res = await api.createExpense(input)
      if (res.success && res.data) {
        setExpenses((prev) => [res.data as ExpenseData, ...prev])
        return { success: true, data: res.data as ExpenseData }
      } else {
        const err = res.error || 'Expense save fail hua'
        setError(err)
        return { success: false, error: err }
      }
    } catch {
      const err = 'Network connection error'
      setError(err)
      return { success: false, error: err }
    }
  }

  const totalExpensesToday = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  return {
    expenses,
    totalExpensesToday,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
  }
}
