'use client'

import { useState, useEffect, useCallback } from 'react'
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
      const res = await fetch('/api/expenses')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setExpenses(json.data)
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
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setExpenses((prev) => [json.data, ...prev])
        return { success: true, data: json.data }
      } else {
        const err = json.error || 'Expense save fail hua'
        setError(err)
        return { success: false, error: err }
      }
    } catch {
      const err = 'Network connection error'
      setError(err)
      return { success: false, error: err }
    }
  }

  const totalExpensesToday = expenses.reduce((sum, e) => sum + e.amount, 0)

  return {
    expenses,
    totalExpensesToday,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
  }
}
