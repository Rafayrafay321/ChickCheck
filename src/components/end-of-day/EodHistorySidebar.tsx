'use client'

import React from 'react'
import type { EODReport } from './types'

export interface EodHistorySidebarProps {
  reports: EODReport[]
  loading: boolean
}

export function EodHistorySidebar({ reports, loading }: EodHistorySidebarProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 h-fit">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 m-0">Recent Day Closings</h3>
          <span className="text-xs text-slate-400 font-medium">Purana hisaab record</span>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          {reports.length} Reports
        </span>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 font-medium animate-pulse p-6 text-center">Reports loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-xs text-slate-400 font-medium p-6 text-center">Koi purani closing report nahi mili.</div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2.5"
            >
              {/* Card Header: Closing Date & Net Profit */}
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Closing Date</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {new Date(rep.reportDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Net Profit</span>
                  <span className={`text-sm font-extrabold ${rep.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Rs {rep.netProfit.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              {/* Metrics Grid with Clear Headings for every number */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Kul Sales</span>
                  <strong className="text-slate-900 font-bold text-xs block truncate">Rs {rep.totalSales.toLocaleString('en-PK')}</strong>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Maal Kharid</span>
                  <strong className="text-slate-900 font-bold text-xs block truncate">Rs {rep.totalPurchases.toLocaleString('en-PK')}</strong>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Kharchay</span>
                  <strong className="text-red-500 font-bold text-xs block truncate">Rs {rep.totalExpenses.toLocaleString('en-PK')}</strong>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Live Farq</span>
                  <strong className={`text-xs font-bold block ${rep.discrepancy < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {rep.discrepancy > 0 ? `+${rep.discrepancy.toFixed(1)}` : rep.discrepancy.toFixed(1)} kg
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
