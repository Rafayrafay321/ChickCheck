'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import type { Product } from './types'

export interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
}

export function ProductTable({ products, onEdit }: ProductTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Naam', 'Urdu Naam', 'Unit', 'Qeemat / Multiplier', 'Type & Status', 'Actions'].map((h) => (
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
            {products.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-slate-50/50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-4 font-semibold text-slate-900">{p.name}</td>
                <td className="px-4 py-4 text-slate-500 italic">{p.nameUrdu ?? '—'}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      p.unit === 'kg' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {p.unit}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {p.pricingType === 'MULTIPLIER' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-xs">
                       {p.defaultMultiplier ?? 1.0}× Mandi Rate
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">Rs. {p.pricePerUnit.toLocaleString('en-PK')}{' '}
                      <span className="font-normal text-slate-400 text-xs">/{p.unit}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant={p.isActive ? 'active' : 'inactive'} />
                    {p.isByproduct && (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">Byproduct
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onEdit(p)}
                      title="Edit karo"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                    >Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
