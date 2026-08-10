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
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold m-0 text-text-primary">💸 Daily Expenses (Kharchay)</h2>
          <p className="text-text-secondary mt-1 text-sm">
            Dukaan ke rozmarrah ke tamam kharchay track karein
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 text-sm font-semibold bg-primary text-white border-none rounded-lg cursor-pointer hover:bg-primary-hover transition-colors min-h-11"
        >
          + Naya Kharcha Daalein
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-xl bg-card border border-border mb-6 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div>
          <span className="text-xs font-medium text-text-secondary">Aaj Ka Total Kharcha:</span>
          <div className="text-2xl font-bold text-red-500 mt-1">
            Rs {totalExpensesToday.toLocaleString('en-PK')}
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          Total Entries Today: <strong className="text-text-primary">{expenses.length}</strong>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/15 text-red-500 rounded-xl mb-4 text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-text-secondary text-sm">
            Expenses load ho rahay hain...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            Aaj koi kharcha record nahi hua. Top button se naya kharcha add karein.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-bg border-b border-border text-left text-text-secondary">
                <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Time</th>
                <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Category</th>
                <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Note</th>
                <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-border last:border-b-0 hover:bg-bg/60 transition-colors">
                  <td className="px-4 py-4 text-text-secondary">
                    {new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-4 font-semibold text-text-primary">
                    {CATEGORY_EMOJIS[exp.category] || exp.category}
                  </td>
                  <td className="px-4 py-4 text-text-secondary">
                    {exp.note || '-'}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-red-500">
                    Rs {exp.amount.toLocaleString('en-PK')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
