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
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold m-0 text-text-primary">📦 Maal Baqi (Stock)</h2>
          <p className="text-text-secondary mt-1 text-sm">Dukaan mein kitna maal bacha hai aur Supplier Purchasing entries</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPurchaseModalOpen(true)}
            className="px-5 py-2.5 text-sm font-semibold bg-blue-500/15 text-blue-500 border border-blue-500/30 rounded-lg cursor-pointer hover:bg-blue-500/25 transition-colors min-h-11"
          >
            🚚 Live Murgi Kharid (Supplier)
          </button>
          <button
            id="btn-add-stock"
            onClick={() => { setFormError(null); setAddModalOpen(true) }}
            className="px-5 py-2.5 text-sm font-semibold bg-primary text-white border-none rounded-lg cursor-pointer hover:bg-primary-hover transition-colors min-h-11"
          >
            + Stock Daalo (IN)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium cursor-pointer bg-transparent border-none border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? 'border-b-primary text-primary font-semibold'
                : 'border-b-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {fetchError && (
        <div className="p-4 bg-red-500/15 text-red-500 rounded-xl mb-4 text-sm font-medium">⚠ {fetchError}</div>
      )}

      {/* Tab: Current Stock */}
      {activeTab === 'current' && <CurrentStockTab isLoading={isLoading} stock={stock} />}

      {/* Tab: Supplier Purchases */}
      {activeTab === 'purchases' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {purchasesLoading ? (
            <div className="p-6 text-center text-text-secondary text-sm">Purchases load ho rahi hain...</div>
          ) : purchases.length === 0 ? (
            <div className="p-10 text-center text-text-secondary text-sm">Koi Supplier Purchase record nahi mila. Top button se nayi entry daalein.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-bg border-b border-border text-left">
                    {['Date', 'Supplier Name', 'Gross Wt', 'Dud (Loss)', 'Net Wt', 'Rate/Kg', 'Total Amount'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr key={p.id} className={`hover:bg-bg/60 transition-colors ${i < purchases.length - 1 ? 'border-b border-border' : ''}`}>
                      <td className="px-4 py-4 text-text-secondary">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4 font-semibold text-text-primary">{p.supplierName}</td>
                      <td className="px-4 py-4 text-text-primary">{p.grossWeight} kg</td>
                      <td className="px-4 py-4 text-red-500">-{p.dudWeight} kg</td>
                      <td className="px-4 py-4 font-semibold text-text-primary">{p.netWeight} kg</td>
                      <td className="px-4 py-4 text-text-primary">Rs {p.ratePerKg}</td>
                      <td className="px-4 py-4 font-bold text-green-500">Rs {p.totalAmount.toLocaleString()}</td>
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
