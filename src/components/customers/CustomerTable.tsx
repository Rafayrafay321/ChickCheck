'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import type { Customer } from './types'

export interface CustomerTableProps {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Naam', 'Qisam', 'Phone', 'Udhaar Baqi', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 font-semibold text-slate-900">{c.name}</td>
                <td className="px-4 py-4">
                  <Badge variant={c.type.toLowerCase() as 'restaurant' | 'retail'} />
                </td>
                <td className="px-4 py-4 text-slate-500">{c.phone ?? '—'}</td>
                <td className="px-4 py-4 font-bold">
                  <span className={c.totalUdhaar > 0 ? 'text-red-600' : 'text-slate-900'}>Rs. {c.totalUdhaar.toLocaleString('en-PK')}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => onEdit(c)}
                      title="Edit karo"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                    >Edit</button>
                    <button
                      onClick={() => onDelete(c)}
                      title="Hata do"
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 active:scale-[0.98] cursor-pointer"
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
