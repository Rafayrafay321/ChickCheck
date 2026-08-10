'use client'

import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'

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

export default function ExpensesPage() {
  const { expenses, totalExpensesToday, loading, error, createExpense } = useExpenses()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">💸 Daily Expenses (Kharchay)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dukaan ke rozmarrah ke tamam kharchay track karein
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          + Naya Kharcha Daalein
        </button>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Aaj Ka Total Kharcha
          </span>
          <div className="text-2xl font-bold text-red-600">
            Rs {totalExpensesToday.toLocaleString('en-PK')}
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500">
          Total Entries Today: <strong className="text-slate-900 font-bold text-sm">{expenses.length}</strong>
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
          <div className="p-6 text-center text-slate-500 text-sm">
            Expenses load ho rahay hain...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Aaj koi kharcha record nahi hua. Top button se naya kharcha add karein.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-slate-500">
                      {new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {CATEGORY_EMOJIS[exp.category] || exp.category}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {exp.note || '-'}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-red-600">
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
