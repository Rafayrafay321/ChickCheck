'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { ErrorState } from '@/components/ui/ErrorState'
import { EodAuditForm } from '@/components/end-of-day/EodAuditForm'
import { EodHistorySidebar } from '@/components/end-of-day/EodHistorySidebar'
import type { LivePool, EODReport, ProductItem } from '@/components/end-of-day/types'

export default function EndOfDayPage() {
  const [livePool, setLivePool] = useState<LivePool | null>(null)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [reports, setReports] = useState<EODReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      const [stockRes, prodRes, eodRes] = await Promise.all([
        api.getStockSummary(),
        api.getProducts(),
        api.getEndOfDayHistory(),
      ])

      if (stockRes.success && stockRes.data) {
        setLivePool((stockRes.data as { livePool: LivePool }).livePool)
      }
      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data as ProductItem[])
      }
      if (eodRes.success && Array.isArray(eodRes.data)) {
        setReports(eodRes.data as EODReport[])
      }
    } catch {
      setError('EOD data load karne mein error hua')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSubmit(data: {
    retailCashDrawer: number
    liveClosingKg: number
    audits: Array<{ productId: string; closingKg: number }>
    note?: string
  }) {
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      setSubmitting(true)
      const res = await api.submitEndOfDay({
        reportDate: new Date().toISOString(),
        retailCashDrawer: data.retailCashDrawer,
        liveClosingKg: data.liveClosingKg,
        audits: data.audits,
        note: data.note,
      })

      if (res.success) {
        setSubmitSuccess('EOD Hisaab kamiyabi se save ho gaya!')
        await loadData()
      } else {
        setSubmitError(res.error || 'EOD save nahi ho saka')
      }
    } catch {
      setSubmitError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header matching Dashboard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 m-0">Day Closing</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Audit
          </span>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadData} />}

      {/* Main Grid: 8-col form + 4-col history */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <EodAuditForm
            livePool={livePool}
            products={products}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
            submitSuccess={submitSuccess}
          />
        </div>

        <div className="lg:col-span-4">
          <EodHistorySidebar reports={reports} loading={loading} />
        </div>
      </div>
    </div>
  )
}
