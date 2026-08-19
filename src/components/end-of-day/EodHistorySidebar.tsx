'use client'

import React from 'react'
import type { EODReport } from './types'

export interface EodHistorySidebarProps {
  reports: EODReport[]
  loading: boolean
}

export function EodHistorySidebar({ reports, loading }: EodHistorySidebarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 h-fit">
      <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 m-0">Recent EOD Reports
      </h3>

      {loading ? (
        <div className="text-xs text-slate-500 animate-pulse">Reports loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-xs text-slate-500">Koi purani EOD report nahi mili.</div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs"
            >
              <div className="flex justify-between font-semibold text-slate-900">
                <span>{new Date(rep.reportDate).toLocaleDateString()}</span>
                <span className="text-emerald-600 font-bold">Net: Rs {rep.netProfit.toLocaleString('en-PK')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sales: Rs {rep.totalSales.toLocaleString('en-PK')}</span>
                <span>Exp: Rs {rep.totalExpenses.toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Purchases: Rs {rep.totalPurchases.toLocaleString('en-PK')}</span>
                <span>Variance:{' '}
                  <strong
                    className={rep.discrepancy < 0 ? 'text-red-600' : 'text-emerald-600'}
                  >
                    {rep.discrepancy > 0 ? `+${rep.discrepancy}` : rep.discrepancy} kg
                  </strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
