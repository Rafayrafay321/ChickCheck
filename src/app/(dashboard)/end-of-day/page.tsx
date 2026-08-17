'use client'

import { useState, useEffect } from 'react'

interface LivePool {
  openingWeight: number
  purchasesWeight: number
  soldWeight: number
  availableWeight: number
}

interface EODReport {
  id: string
  reportDate: string
  farmRate: number | null
  supplyRate: number | null
  totalSales: number
  totalPurchases: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  retailCashDrawer: number
  discrepancy: number
  note: string | null
  createdAt: string
}

export default function EndOfDayPage() {
  const [livePool, setLivePool] = useState<LivePool | null>(null)
  const [reports, setReports] = useState<EODReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [liveClosingKg, setLiveClosingKg] = useState('')
  const [retailCashDrawer, setRetailCashDrawer] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [stockRes, eodRes] = await Promise.all([
          fetch('/api/stock').then((r) => r.json()),
          fetch('/api/eod').then((r) => r.json()),
        ])

        if (stockRes.success && stockRes.data) {
          setLivePool(stockRes.data.livePool)
        }
        if (eodRes.success && Array.isArray(eodRes.data)) {
          setReports(eodRes.data)
        }
      } catch {
        setError('EOD data load karne mein error hua')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const expectedRemaining = livePool?.availableWeight ?? 0
  const currentPhysical = parseFloat(liveClosingKg) || 0
  const liveVariance = liveClosingKg ? currentPhysical - expectedRemaining : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    const cash = parseFloat(retailCashDrawer) || 0

    try {
      setSubmitting(true)
      const res = await fetch('/api/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailCashDrawer: cash,
          liveClosingKg: currentPhysical,
          note: note.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        setSubmitSuccess('Aaj ka End of Day Report & Live Pool Audit save ho gaya!')
        setReports((prev) => [json.data, ...prev.filter((r) => r.id !== json.data.id)])
      } else {
        setSubmitError(json.error || 'EOD submission fail hua')
      }
    } catch {
      setSubmitError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">📊 Din Khatam (End of Day Audit)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Shared Live Hen Pool Audit, Cash Drawer Count, aur Net Profit Calculation
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* Main Audit Form & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 m-0">
            1. Shared Live Hen Pool Reconciliation
          </h3>

          {submitError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
              ⚠ {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
              ✅ {submitSuccess}
            </div>
          )}

          {/* Live Weight Pool Reconciliation Panel */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1 font-medium">Opening + Purchases</span>
                <strong className="text-sm text-slate-900">{((livePool?.openingWeight ?? 0) + (livePool?.purchasesWeight ?? 0))} kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 font-medium">Total Sold (All Cuts)</span>
                <strong className="text-sm text-red-600">-{livePool?.soldWeight ?? 0} kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 font-medium">Expected Remaining</span>
                <strong className="text-sm text-blue-600">{expectedRemaining} kg</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Raat Ko Physical Live Hen Count (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder={`e.g. ${expectedRemaining}`}
                  value={liveClosingKg}
                  onChange={(e) => setLiveClosingKg(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {liveVariance !== null && (
                <div className={`p-3 rounded-lg border text-xs font-medium ${liveVariance >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <span>Variance / Difference:</span>
                  <strong className="block text-base font-bold mt-0.5">
                    {liveVariance > 0 ? `+${liveVariance.toFixed(1)}` : liveVariance.toFixed(1)} kg
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Cash Drawer Count */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              2. Retail Cash in Hand (Draz Mein Cash)
            </label>
            <input
              type="number"
              step="1"
              required
              placeholder="e.g. 85000"
              value={retailCashDrawer}
              onChange={(e) => setRetailCashDrawer(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shabeen bill pending, live pool variance noted..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Calculating...' : 'Submit End of Day Audit'}
          </button>
        </form>

        {/* EOD History Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 h-fit">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 m-0">
            📜 Recent EOD Reports
          </h3>

          {loading ? (
            <div className="text-xs text-slate-500">Reports loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-xs text-slate-500">Koi purani EOD report nahi mili.</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>{new Date(rep.reportDate).toLocaleDateString()}</span>
                    <span className="text-emerald-600 font-bold">Net: Rs {rep.netProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Sales: Rs {rep.totalSales.toLocaleString()}</span>
                    <span>Exp: Rs {rep.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Purchases: Rs {rep.totalPurchases.toLocaleString()}</span>
                    <span>Variance: <strong className={rep.discrepancy < 0 ? 'text-red-600' : 'text-emerald-600'}>{rep.discrepancy > 0 ? `+${rep.discrepancy}` : rep.discrepancy} kg</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
