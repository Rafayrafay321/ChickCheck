'use client'

import React from 'react'
import type { Supplier } from './types'

export interface SupplierTableProps {
  suppliers: Supplier[]
  onPay: (supplier: Supplier) => void
  onViewLedger: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
}

export function SupplierTable({
  suppliers,
  onPay,
  onViewLedger,
  onEdit,
  onDelete,
}: SupplierTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full border-collapse text-sm text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Markup
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchases
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Baqi Raqam
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {suppliers.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{s.name}</span>
                  {!s.isActive && (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-500">Inactive
                    </span>
                  )}
                </div>
                {(s.phone || s.address) && (
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    {s.phone && <span>{s.phone}</span>}
                    {s.phone && s.address && <span className="text-slate-300">•</span>}
                    {s.address && <span className="text-slate-400">{s.address}</span>}
                  </div>
                )}
              </td>

              <td className="px-4 py-3.5 whitespace-nowrap">
                {(() => {
                  const premium = s.ratePremium ?? 4
                  if (premium > 0) {
                    return (
                      <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        +Rs {premium}/kg
                      </span>
                    )
                  }
                  if (premium < 0) {
                    return (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        -Rs {Math.abs(premium)}/kg Discount
                      </span>
                    )
                  }
                  return (
                    <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Farm Rate (Rs 0)
                    </span>
                  )
                })()}
              </td>

              <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                <span className="font-semibold text-slate-900">{s._count?.purchases ?? 0}</span> purchases
              </td>

              <td className="px-4 py-3.5 font-bold text-sm whitespace-nowrap">
                <span className={s.totalPayable > 0 ? 'text-red-600' : 'text-emerald-700'}>Rs {s.totalPayable.toLocaleString('en-PK')}
                </span>
              </td>

              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                <div className="flex gap-1.5 justify-end items-center">
                  {/* Pay Button */}
                  <button
                    type="button"
                    onClick={() => onPay(s)}
                    title="Adaiygi karo"
                    className="rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-100 active:scale-[0.98] cursor-pointer transition-all"
                  >Pay</button>

                  {/* Ledger Button */}
                  <button
                    type="button"
                    onClick={() => onViewLedger(s)}
                    title="Khata dekho"
                    className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-100 active:scale-[0.98] cursor-pointer transition-all"
                  >Khata</button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    title="Edit karo"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-[0.98] cursor-pointer transition-all"
                  >Edit</button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    title="Deactivate karo"
                    className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-2xs hover:bg-red-50 active:scale-[0.98] cursor-pointer transition-all"
                  >Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
