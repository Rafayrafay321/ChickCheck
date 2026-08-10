'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  unit: string
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
  note: string | null
  createdAt: string
}

export default function EndOfDayPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [reports, setReports] = useState<EODReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [retailCashDrawer, setRetailCashDrawer] = useState('')
  const [stockAuditInputs, setStockAuditInputs] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [prodRes, eodRes] = await Promise.all([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/eod').then((r) => r.json()),
        ])

        if (prodRes.success && Array.isArray(prodRes.data)) {
          setProducts(prodRes.data)
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

  function handleAuditChange(productId: string, value: string) {
    setStockAuditInputs((prev) => ({
      ...prev,
      [productId]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    const cash = parseFloat(retailCashDrawer) || 0
    const audits = Object.entries(stockAuditInputs)
      .map(([productId, val]) => ({
        productId,
        closingKg: parseFloat(val) || 0,
      }))
      .filter((a) => !isNaN(a.closingKg))

    try {
      setSubmitting(true)
      const res = await fetch('/api/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailCashDrawer: cash,
          note: note.trim() || undefined,
          audits,
        }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        setSubmitSuccess('Aaj ka End of Day Report kamyabi se save ho gaya!')
        setReports((prev) => [json.data, ...prev])
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
          Roz ka hisaab — physical stock audit, cash drawer count, aur Net Profit calculation
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
            1. Physical Stock Count & Cash Audit
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

          {/* Physical Stock Audit Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Raat Ko Bacha Hua Stock Count (Kg)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="block text-xs font-semibold text-slate-900 mb-1.5 truncate">
                    {p.name}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0 kg"
                    value={stockAuditInputs[p.id] || ''}
                    onChange={(e) => handleAuditChange(p.id, e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Cash Drawer Count */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Retail Cash in Hand (Draz Mein Cash)
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
              placeholder="e.g. Shabeen bill pending, stock balanced..."
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
                    <span>Drawer: Rs {rep.retailCashDrawer.toLocaleString()}</span>
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
