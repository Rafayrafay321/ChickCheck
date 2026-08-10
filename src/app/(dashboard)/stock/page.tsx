'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { ProductStock, StockHistoryEntry } from './types'
import { CurrentStockTab } from '@/components/stock/CurrentStockTab'
import { HistoryTab } from '@/components/stock/HistoryTab'
import { AddStockModal } from '@/components/stock/AddStockModal'
import { SupplierPurchaseModal } from '@/components/stock/SupplierPurchaseModal'
import { useSupplierPurchases } from '@/hooks/useSupplierPurchases'

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'purchases'>('current')

  const [stock, setStock] = useState<ProductStock[]>([])
  const [history, setHistory] = useState<StockHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const { purchases, loading: purchasesLoading, createPurchase } = useSupplierPurchases()
  const [historyProductId, setHistoryProductId] = useState<string>('')

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchStock = useCallback(async () => {
    setIsLoading(true); setFetchError(null)
    const res = await api.getStockSummary()
    if (res.success && Array.isArray(res.data)) setStock(res.data as ProductStock[])
    else setFetchError(res.error ?? 'Data load nahi hua')
    setIsLoading(false)
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

  async function handleAddStock(productId: string, quantity: number, note: string) {
    setFormLoading(true); setFormError(null)
    const res = await api.addStockEntry({ productId, type: 'IN', quantity, note: note || undefined })
    if (res.success) {
      setAddModalOpen(false)
      if (activeTab === 'current') await fetchStock()
      else if (historyProductId === productId) await fetchHistory(productId)
    } else {
      setFormError(res.error ?? 'Nahi ho saka')
    }
    setFormLoading(false)
  }

  const TABS = [
    { id: 'current', label: 'Aaj ka Stock' },
    { id: 'purchases', label: '🚚 Supplier Purchases' },
    { id: 'history', label: 'Pichla Record (History)' },
  ] as const

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">📦 Maal Baqi (Stock)</h2>
          <p className="text-sm text-slate-500 mt-1">Dukaan mein kitna maal bacha hai aur Supplier Purchasing entries</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPurchaseModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            🚚 Live Murgi Kharid (Supplier)
          </button>
          <button
            id="btn-add-stock"
            onClick={() => { setFormError(null); setAddModalOpen(true) }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            + Stock Daalo (IN)
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

      {/* Error State */}
      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">⚠ {fetchError}</div>
      )}

      {/* Tab: Current Stock */}
      {activeTab === 'current' && <CurrentStockTab isLoading={isLoading} stock={stock} />}

      {/* Tab: Supplier Purchases */}
      {activeTab === 'purchases' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {purchasesLoading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Purchases load ho rahi hain...</div>
          ) : purchases.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">Koi Supplier Purchase record nahi mila. Top button se nayi entry daalein.</div>
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
                      <td className="px-4 py-4 text-slate-500">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{p.supplierName}</td>
                      <td className="px-4 py-4 text-slate-900">{p.grossWeight} kg</td>
                      <td className="px-4 py-4 text-red-600">-{p.dudWeight} kg</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{p.netWeight} kg</td>
                      <td className="px-4 py-4 text-slate-900">Rs {p.ratePerKg}</td>
                      <td className="px-4 py-4 font-bold text-emerald-600">Rs {p.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <HistoryTab stock={stock} history={history} isLoading={isLoading} historyProductId={historyProductId} setHistoryProductId={setHistoryProductId} />
      )}

      {/* Modals */}
      <AddStockModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} stock={stock} onSubmit={handleAddStock} formLoading={formLoading} formError={formError} />
      <SupplierPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSubmit={async (input) => {
          const res = await createPurchase(input)
          if (res.success) await fetchStock()
          return res
        }}
      />
    </div>
  )
}
