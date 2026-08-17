'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'
import type { ExpenseInput } from '@/shared/types'

interface ExpenseData {
  id: string
  category: 'PETROL' | 'BAGS' | 'BIKE' | 'PUNCHER' | 'POLICE' | 'LUNCH' | 'WAGES' | 'OTHER'
  amount: number
  note: string | null
  date: string
  createdAt: string
}

const CATEGORY_EMOJIS: Record<string, string> = {
  PETROL: '⛽ Petrol',
  BAGS: '🛍️ Poly Bags',
  BIKE: '🛵 Bike Repair',
  PUNCHER: '🔧 Puncher',
  POLICE: '👮 Police/Chungi',
  LUNCH: '🍱 Lunch/Khaana',
  WAGES: '💼 Wages/Mazdoori',
  OTHER: '📝 Other Kharcha',
}

function getTodayStr() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
      const params = new URLSearchParams()
      if (filterDate) {
        params.set('date', filterDate)
      } else {
        params.set('all', 'true')
      }
      if (filterCategory) {
        params.set('category', filterCategory)
      }

      const res = await fetch(`/api/expenses?${params.toString()}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setExpenses(json.data)
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
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (json.success && json.data) {
        await fetchExpenses()
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

  const todayStr = getTodayStr()
  const isToday = filterDate === todayStr
  const isAllDates = !filterDate
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">💸 Kharchay (Expenses)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isToday ? 'Aaj ke dukan ke tamam kharchay' : isAllDates ? 'Tamam pichlay kharchay' : `Kharchay baraye ${filterDate}`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>+</span> Naya Kharcha
        </button>
      </div>

      {/* Clean Streamlined Filters & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Toggle Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={() => setFilterDate(todayStr)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isToday
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aaj (Today)
            </button>
            <button
              type="button"
              onClick={() => setFilterDate('')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isAllDates
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tamam (All)
            </button>
          </div>

          {/* Custom Date Picker */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
          />

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
          >
            <option value="">Sab Categories</option>
            {Object.entries(CATEGORY_EMOJIS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Total Expense Highlight & Reset */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Kharcha ({expenses.length})
            </span>
            <strong className="text-base font-bold text-red-600">
              Rs {totalAmount.toLocaleString('en-PK')}
            </strong>
          </div>
          {(!isToday || filterCategory) && (
            <button
              type="button"
              onClick={() => {
                setFilterDate(todayStr)
                setFilterCategory('')
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* Expenses Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
            Kharchay load ho rahe hain...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Koi kharcha record nahi mila. Top button se naya kharcha add karein.
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
                        {CATEGORY_EMOJIS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {exp.note || '—'}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-red-600 text-sm">
                      Rs {exp.amount.toLocaleString('en-PK')}
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
