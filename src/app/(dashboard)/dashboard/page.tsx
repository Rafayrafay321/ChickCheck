'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface DashboardData {
  todaySales: number
  todayPurchases: number
  todayExpenses: number
  netProfit: number
  totalUdhaar: number
  livePoolAvailable: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Dashboard data load nahi hua')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-20 bg-slate-200 rounded-xl" />
          <div className="h-20 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
        ⚠ {error || 'Data load karne mein masla hua'}
      </div>
    )
  }

  const isProfit = data.netProfit >= 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 m-0">Dashboard</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Session
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm text-sm font-semibold transition-all active:scale-[0.98] no-underline"
          >
            <span>+</span> Naya Order
          </Link>
          <Link
            href="/stock"
            className="inline-flex items-center justify-center px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm text-sm font-medium transition-all active:scale-[0.98] no-underline"
          >
            🚚 Maal Kharid
          </Link>
          <Link
            href="/expenses"
            className="inline-flex items-center justify-center px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm text-sm font-medium transition-all active:scale-[0.98] no-underline"
          >
            💸 Kharcha
          </Link>
          <Link
            href="/end-of-day"
            className="inline-flex items-center justify-center px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm text-sm font-medium transition-all active:scale-[0.98] no-underline"
          >
            📊 EOD Hisaab
          </Link>
        </div>
      </div>

      {/* 2. Unified Hero Financial Summary Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Net Profit Indicator (Left Col) */}
          <div className="lg:col-span-5 lg:border-r lg:border-slate-100 lg:pr-6 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              📈 Aaj Ka Munafa (Net Profit)
            </span>
            <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              Rs {data.netProfit.toLocaleString('en-PK')}
            </div>
          </div>

          {/* 3 Core Financial Pillars (Right Col) */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-4 text-left">
            {/* Sales */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                💰 Kul Sales
              </span>
              <strong className="text-lg sm:text-xl font-bold text-slate-900 block truncate">
                Rs {data.todaySales.toLocaleString('en-PK')}
              </strong>
              <span className="text-[11px] text-emerald-600 font-medium">+ Income</span>
            </div>

            {/* Purchases */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                🚚 Maal Kharid
              </span>
              <strong className="text-lg sm:text-xl font-bold text-slate-900 block truncate">
                Rs {data.todayPurchases.toLocaleString('en-PK')}
              </strong>
              <span className="text-[11px] text-slate-400 font-medium">Live & Cuts</span>
            </div>

            {/* Expenses */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                💸 Dukan Kharchay
              </span>
              <strong className="text-lg sm:text-xl font-bold text-slate-900 block truncate">
                Rs {data.todayExpenses.toLocaleString('en-PK')}
              </strong>
              <span className="text-[11px] text-red-500 font-medium">- Deductions</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Quick Stat Strips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Udhaar */}
        <Link
          href="/udhaar"
          className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-slate-300 transition-all flex items-center justify-between no-underline"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              📒 Kul Udhaar Baqi
            </span>
            <strong className="text-2xl font-bold text-red-600 block mt-1">
              Rs {data.totalUdhaar.toLocaleString('en-PK')}
            </strong>
          </div>
          <span className="text-xs font-semibold text-red-600 group-hover:translate-x-0.5 transition-transform">
            Khata Dekhein →
          </span>
        </Link>

        {/* Mojooda Stock */}
        <Link
          href="/stock"
          className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-slate-300 transition-all flex items-center justify-between no-underline"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              🐔 Mojooda Stock
            </span>
            <strong className="text-2xl font-bold text-blue-600 block mt-1">
              {data.livePoolAvailable.toFixed(1)} kg
            </strong>
          </div>
          <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
            Stock Dekhein →
          </span>
        </Link>
      </div>
    </div>
  )
}
