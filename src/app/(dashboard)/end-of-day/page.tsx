'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState } from '@/components/ui/ErrorState'
import { EodAuditForm } from '@/components/end-of-day/EodAuditForm'
import { EodHistorySidebar } from '@/components/end-of-day/EodHistorySidebar'
import type { LivePool, EODReport } from '@/components/end-of-day/types'

export default function EndOfDayPage() {
  const [livePool, setLivePool] = useState<LivePool | null>(null)
  const [reports, setReports] = useState<EODReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      const [stockRes, eodRes] = await Promise.all([
        api.getStockSummary(),
        api.getEndOfDayHistory(),
      ])

      if (stockRes.success && stockRes.data) {
        setLivePool((stockRes.data as { livePool: LivePool }).livePool)
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
    note?: string
  }) {
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      setSubmitting(true)
      const res = await api.submitEndOfDay({
        reportDate: new Date().toISOString(),
        retailCashDrawer: data.retailCashDrawer,
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
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="Din Khatam (End of Day Audit)"
        subtitle="Shared Live Hen Pool Audit, Cash Drawer Count, aur Net Profit Calculation"
      />

      {error && <ErrorState message={error} onRetry={loadData} />}

      {/* Main Audit Form & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EodAuditForm
          livePool={livePool}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
        />

        <EodHistorySidebar reports={reports} loading={loading} />
      </div>
    </div>
  )
}
