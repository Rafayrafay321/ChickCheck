'use client'

interface LivePoolData {
  openingWeight: number
  purchasesWeight: number
  soldWeight: number
  availableWeight: number
}

interface EmergencyPurchaseItem {
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
}

interface CurrentStockTabProps {
  isLoading: boolean
  livePool?: LivePoolData | null
  emergencyStock?: {
    purchases: EmergencyPurchaseItem[]
    totalEmergencyHenAvailable: number
    totalEmergencyCost: number
  } | null
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-xl bg-slate-200 animate-pulse" />
      <div className="h-28 rounded-xl bg-slate-200 animate-pulse" />
    </div>
  )
}

export function CurrentStockTab({ isLoading, livePool, emergencyStock }: CurrentStockTabProps) {
  if (isLoading) return <LoadingSkeleton />

  const hasEmergencyToday = (emergencyStock?.purchases?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* 1. Shared Daily Live Hen Pool Hero Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">🐔 Live Weight</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Yesterday's Opening Weight
            </span>
            <strong className="text-xl font-bold text-slate-900">
              {livePool?.openingWeight ?? 0} kg
            </strong>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Purchases Weight
            </span>
            <strong className="text-xl font-bold text-emerald-600">
              +{livePool?.purchasesWeight ?? 0} kg
            </strong>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Sold Weight
            </span>
            <strong className="text-xl font-bold text-red-600">
              -{livePool?.soldWeight ?? 0} kg
            </strong>
          </div>

          <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 block mb-1">
              Available Weight
            </span>
            <strong className="text-2xl font-bold text-blue-700">
              {livePool?.availableWeight ?? 0} kg
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Emergency / Shortage Stock Panel */}
      <div className="rounded-xl border border-orange-200 bg-orange-50/30 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-200 bg-orange-50">
          <div>
            <h3 className="text-sm font-bold text-orange-800 m-0">⚡ Emergency / Shortage Stock</h3>
          </div>
          {hasEmergencyToday && (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              Total Cost: Rs {emergencyStock!.totalEmergencyCost.toLocaleString()}
            </span>
          )}
        </div>

        {!hasEmergencyToday ? (
          <div className="p-5 text-xs text-orange-700 text-center">
            Aaj koi emergency purchase nahi ki gayi. Agar stock khatam ho jaye tou top par "⚡ Kharid" button use karein.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-orange-50/80 border-b border-orange-200">
                  {['Maal', 'Supplier', 'Kharida (kg)', 'Rate (Rs/kg)', 'Istemal (kg)', 'Bacha Hua (kg)'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-orange-700 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {emergencyStock!.purchases.map((ep) => (
                  <tr key={ep.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {ep.isLiveHen ? '🐔 Zinda Murgi (Emergency)' : (ep.product?.name ?? '—')}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{ep.supplierName ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{ep.quantity} kg</td>
                    <td className="px-4 py-3 text-slate-700">Rs {ep.costPerKg}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{ep.usedQty.toFixed(1)} kg</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${ep.remainingQty <= 0 ? 'text-slate-400' : 'text-emerald-600'}`}>
                        {ep.remainingQty.toFixed(1)} kg
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
