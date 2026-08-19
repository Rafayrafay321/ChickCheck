'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { ProductStock, StockHistoryEntry } from './types'
import { CurrentStockTab } from '@/components/stock/CurrentStockTab'
import { HistoryTab } from '@/components/stock/HistoryTab'
import { SupplierPurchaseModal } from '@/components/stock/SupplierPurchaseModal'
import { EmergencyPurchaseModal } from '@/components/stock/EmergencyPurchaseModal'
import { useSupplierPurchases } from '@/hooks/useSupplierPurchases'

interface LivePoolState {
  openingWeight: number
  purchasesWeight: number
  soldWeight: number
  availableWeight: number
}

interface EmergencyStockState {
  purchases: Array<{
    id: string
    isLiveHen: boolean
    productId: string | null
    supplierName: string | null
    quantity: number
    costPerKg: number
    totalCost: number
    usedQty: number
    remainingQty: number
    note: string | null
    product?: { name: string; nameUrdu: string | null; unit: string } | null
  }>
  totalEmergencyHenAvailable: number
  totalEmergencyCost: number
}

function getTodayStr() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'purchases'>('current')

  const [livePool, setLivePool] = useState<LivePoolState | null>(null)
  const [emergencyStock, setEmergencyStock] = useState<EmergencyStockState | null>(null)
  const [stock, setStock] = useState<ProductStock[]>([])
  const [history, setHistory] = useState<StockHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [purchaseFilterDate, setPurchaseFilterDate] = useState<string>(getTodayStr())
  const { purchases, loading: purchasesLoading, createPurchase } = useSupplierPurchases({
    date: purchaseFilterDate || undefined,
    all: !purchaseFilterDate,
  })
  const [historyProductId, setHistoryProductId] = useState<string>('')

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)

  const fetchStock = useCallback(async () => {
    setIsLoading(true); setFetchError(null)
    try {
      const [stockRes, prodRes, emergencyRes] = await Promise.all([
        api.getStockSummary(),
        api.getProducts(),
        api.getEmergencyPurchases(),
      ])

      if (stockRes.success && stockRes.data) {
        setLivePool((stockRes.data as { livePool: LivePoolState }).livePool)
      }
      if (prodRes.success && Array.isArray(prodRes.data)) {
        const prodList = prodRes.data as Array<{ id: string; name: string; nameUrdu: string | null; unit: 'kg' | 'piece' }>
        setStock(prodList.map((p) => ({ ...p, currentStock: 0 })))
      }
      if (emergencyRes.success && emergencyRes.data) {
        setEmergencyStock(emergencyRes.data as EmergencyStockState)
      }
    } catch {
      setFetchError('Connection error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async (productId: string) => {
    if (!productId) { setHistory([]); return }
    setIsLoading(true); setFetchError(null)
    const res = await api.getStockHistory(productId)
    if (res.success && Array.isArray(res.data)) setHistory(res.data as StockHistoryEntry[])
    else setFetchError(res.error ?? 'History load nahi hui')
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'current') fetchStock()
    else if (activeTab === 'history' && historyProductId) fetchHistory(historyProductId)
  }, [activeTab, historyProductId, fetchStock, fetchHistory])

  useEffect(() => {
    if (activeTab === 'history' && !historyProductId && stock.length > 0) {
      setHistoryProductId(stock[0].id)
    }
  }, [activeTab, historyProductId, stock])

  const TABS = [
    { id: 'current', label: 'Current Stock' },
    { id: 'purchases', label: 'Supplier Purchases' },
    { id: 'history', label: 'Pichla Record (History)' },
  ] as const

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900"> Current Stock</h2>
          <p className="text-sm text-slate-500 mt-1">
  Live Stock & Inventory</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPurchaseModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
  Chicken Purchase
          </button>
          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
  Shortage Purchase
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium cursor-pointer bg-transparent border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">{fetchError}</div>
      )}

      {activeTab === 'current' && (
        <CurrentStockTab
          isLoading={isLoading}
          livePool={livePool}
          emergencyStock={emergencyStock}
        />
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {/* Clean Filters Bar for Purchases */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Quick Date Toggle */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setPurchaseFilterDate(getTodayStr())}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    purchaseFilterDate === getTodayStr()
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
  Aaj (Today)
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseFilterDate('')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    !purchaseFilterDate
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
  Tamam (All)
                </button>
              </div>

              {/* Custom Date Picker */}
              <input
                type="date"
                value={purchaseFilterDate}
                onChange={(e) => setPurchaseFilterDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Purchases Stats & Reset */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
  Total: <strong className="text-slate-900 font-bold">{purchases.length}</strong> entries
              </span>
              {purchaseFilterDate !== getTodayStr() && (
                <button
                  type="button"
                  onClick={() => setPurchaseFilterDate(getTodayStr())}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer ml-1"
                >
  Reset</button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {purchasesLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
  Purchases load ho rahi hain...</div>
            ) : purchases.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
  Koi Supplier Purchase record nahi mila. Top button se nayi entry daalein.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Date', 'Supplier Name', 'Gross Wt', 'Dud (Loss)', 'Net Wt', 'Rate/Kg', 'Total Amount'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 text-slate-500 text-xs">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">{p.supplierName}</td>
                        <td className="px-4 py-4 text-slate-900">{p.grossWeight} kg</td>
                        <td className="px-4 py-4 text-red-600 font-medium">-{p.dudWeight} kg</td>
                        <td className="px-4 py-4 font-bold text-slate-900">{p.netWeight} kg</td>
                        <td className="px-4 py-4 text-slate-600 text-xs">
  Rs {p.ratePerKg}</td>
                        <td className="px-4 py-4 font-bold text-emerald-600">
  Rs {p.totalAmount.toLocaleString('en-PK')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <HistoryTab stock={stock} history={history} isLoading={isLoading} historyProductId={historyProductId} setHistoryProductId={setHistoryProductId} />
      )}

      {/* Modals */}
      <SupplierPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSubmit={async (input) => {
          const res = await createPurchase(input)
          if (res.success) await fetchStock()
          return res
        }}
      />
      <EmergencyPurchaseModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onSuccess={fetchStock}
      />
    </div>
  )
}
