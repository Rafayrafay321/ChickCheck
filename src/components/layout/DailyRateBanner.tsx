'use client'

import { useState } from 'react'
import { useDailyRate } from '@/hooks/useDailyRate'
import { Modal } from '@/components/ui/Modal'
import { DailyRateForm } from '@/components/daily-rate/DailyRateForm'

export function DailyRateBanner() {
  const { dailyRate, loading, updateDailyRate } = useDailyRate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleFormSubmit = async (farmRate: number, supplierPremium: number) => {
    const res = await updateDailyRate(farmRate, supplierPremium)
    if (res.success) {
      setIsModalOpen(false)
    }
    return res
  }

  return (
    <>
      <div className="inline-flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-700">
        {loading ? (
          <span className="text-amber-500">Rate load ho raha hai...</span>
        ) : dailyRate ? (
          <>
            <span>🐔 <strong>Farm Rate:</strong> Rs {dailyRate.farmRate}/kg</span>
            <span className="text-amber-300">|</span>
            <span>🚚 <strong>Supply Rate (+{dailyRate.supplierPremium}):</strong> Rs {dailyRate.supplyRate}/kg</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-1 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[0.7rem] font-medium text-amber-600 shadow-sm transition-all hover:bg-amber-50 active:scale-[0.98] cursor-pointer"
            >
              Edit Rate
            </button>
          </>
        ) : (
          <>
            <span>⚠️ <strong>Aaj Ka Rate Missing Hai!</strong></span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-1 rounded-md bg-amber-500 px-2.5 py-0.5 text-[0.7rem] font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] cursor-pointer border-none"
            >
              + Rate Enter Karein
            </button>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen || (!loading && !dailyRate)}
        onClose={() => setIsModalOpen(false)}
        title="🐔 Aaj Ka Daily Farm Rate"
      >
        <DailyRateForm
          initialData={dailyRate}
          onSubmit={handleFormSubmit}
          onCancel={dailyRate ? () => setIsModalOpen(false) : undefined}
        />
      </Modal>
    </>
  )
}
