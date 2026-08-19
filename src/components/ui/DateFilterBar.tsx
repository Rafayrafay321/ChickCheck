'use client'

import React from 'react'

export function getTodayStr(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface DateFilterBarProps {
  date: string
  onDateChange: (date: string) => void
  children?: React.ReactNode
  summarySlot?: React.ReactNode
  showReset?: boolean
  onReset?: () => void
}

export function DateFilterBar({
  date,
  onDateChange,
  children,
  summarySlot,
  showReset = false,
  onReset,
}: DateFilterBarProps) {
  const todayStr = getTodayStr()
  const isToday = date === todayStr
  const isAllDates = !date

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Quick Date Toggle Pills */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/60">
          <button
            type="button"
            onClick={() => onDateChange(todayStr)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isToday
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >Aaj (Today)
          </button>
          <button
            type="button"
            onClick={() => onDateChange('')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isAllDates
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >Tamam (All)
          </button>
        </div>

        {/* Date Input */}
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
        />

        {/* Injected Filter Controls (Dropdowns, Search, etc.) */}
        {children}
      </div>

      {/* Right-Side Summary & Reset */}
      <div className="flex items-center gap-2">
        {summarySlot}
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer ml-1"
          >Reset</button>
        )}
      </div>
    </div>
  )
}
