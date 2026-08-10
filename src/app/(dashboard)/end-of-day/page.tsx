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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary m-0">📊 Din Khatam (End of Day Audit)</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Roz ka hisaab — physical stock audit, cash drawer count, aur Net Profit calculation
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/15 text-red-500 rounded-xl text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      {/* Main Audit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-card p-6 rounded-xl border border-border space-y-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-3 m-0">
            1. Physical Stock Count & Cash Audit
          </h3>

          {submitError && (
            <div className="p-3 bg-red-500/15 text-red-500 rounded-lg text-xs font-medium">
              ⚠ {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="p-3 bg-green-500/15 text-green-500 rounded-lg text-xs font-medium">
              ✅ {submitSuccess}
            </div>
          )}

          {/* Physical Stock Audit Grid */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-3">
              Raat Ko Bacha Hua Stock Count (Kg)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((p) => (
                <div key={p.id} className="p-3 bg-bg rounded-lg border border-border">
                  <span className="block text-xs font-semibold text-text-primary mb-1 truncate">
                    {p.name}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0 kg"
                    value={stockAuditInputs[p.id] || ''}
                    onChange={(e) => handleAuditChange(p.id, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Cash Drawer Count */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Retail Cash in Hand (Draz Mein Cash)
            </label>
            <input
              type="number"
              step="1"
              required
              placeholder="e.g. 85000"
              value={retailCashDrawer}
              onChange={(e) => setRetailCashDrawer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shabeen bill pending, stock balanced..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 text-sm"
          >
            {submitting ? 'Calculating...' : 'Submit End of Day Audit'}
          </button>
        </form>

        {/* EOD History Sidebar */}
        <div className="bg-card p-6 rounded-xl border border-border space-y-4 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-3 m-0">
            📜 Recent EOD Reports
          </h3>

          {loading ? (
            <div className="text-xs text-text-secondary">Reports loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-xs text-text-secondary">Koi purani EOD report nahi mili.</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3 bg-bg rounded-lg border border-border space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-text-primary">
                    <span>{new Date(rep.reportDate).toLocaleDateString()}</span>
                    <span className="text-green-500">Net: Rs {rep.netProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Sales: Rs {rep.totalSales.toLocaleString()}</span>
                    <span>Exp: Rs {rep.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
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
