'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { DateFilterBar, getTodayStr } from '@/components/ui/DateFilterBar'
import type { ExpenseInput } from '@/shared/types'

interface ExpenseData {
  id: string
  category: 'PETROL' | 'BAGS' | 'BIKE' | 'PUNCHER' | 'POLICE' | 'LUNCH' | 'WAGES' | 'OTHER'
  amount: number
  note: string | null
  date: string
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  PETROL: 'Petrol',
  BAGS: 'Poly Bags',
  BIKE: 'Bike Repair',
  PUNCHER: 'Puncher',
  POLICE: 'Police/Chungi',
  LUNCH: 'Lunch/Khaana',
  WAGES: 'Wages/Mazdoori',
  OTHER: 'Other Kharcha',
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filters — default to today
  const [filterDate, setFilterDate] = useState<string>(getTodayStr())
  const [filterCategory, setFilterCategory] = useState<string>('')

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getExpenses(filterCategory || undefined, filterDate || undefined)
      if (res.success && Array.isArray(res.data)) {
        setExpenses(res.data as ExpenseData[])
      } else {
        setExpenses([])
      }
    } catch {
      setError('Expenses load karne mein masla hua')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterCategory])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const createExpense = async (input: ExpenseInput) => {
    try {
      setError(null)
      const res = await api.createExpense(input)
      if (res.success && res.data) {
        await fetchExpenses()
        return { success: true, data: res.data }
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

  const isToday = filterDate === getTodayStr()
  const isAllDates = !filterDate
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="Kharchay (Expenses)"
        subtitle={isToday ? 'Aaj ke dukan ke tamam kharchay' : isAllDates ? 'Tamam pichlay kharchay' : `Kharchay baraye ${filterDate}`}
        actionLabel="Naya Kharcha"
        onAction={() => setIsModalOpen(true)}
      />

      {/* Reusable DateFilterBar */}
      <DateFilterBar
        date={filterDate}
        onDateChange={setFilterDate}
        showReset={!isToday || !!filterCategory}
        onReset={() => {
          setFilterDate(getTodayStr())
          setFilterCategory('')
        }}
        summarySlot={
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Kharcha ({expenses.length})
            </span>
            <strong className="text-base font-bold text-red-600">Rs {totalAmount.toLocaleString('en-PK')}
            </strong>
          </div>
        }
      >
        {/* Category Dropdown Slot */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
        >
          <option value="">Sab Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </DateFilterBar>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Expenses Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Kharchay load ho rahe hain...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Koi kharcha record nahi mila. Top button se naya kharcha add karein.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Waqt / Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tafseel (Note)</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Raqam (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {new Date(exp.createdAt).toLocaleDateString()}{' '}
                      <span className="text-slate-400 font-mono">
                        {new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium">
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {exp.note || '—'}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-red-600 text-sm">Rs {exp.amount.toLocaleString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Popup */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createExpense}
      />
    </div>
  )
}
