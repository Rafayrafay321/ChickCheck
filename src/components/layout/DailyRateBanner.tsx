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
      <div className="flex items-center gap-3 text-xs font-medium px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500">
        {loading ? (
          <span>Rate load ho raha hai...</span>
        ) : dailyRate ? (
          <>
            <span>🐔 <strong>Farm Rate:</strong> Rs {dailyRate.farmRate}/kg</span>
            <span className="opacity-60">|</span>
            <span>🚚 <strong>Supply Rate (+{dailyRate.supplierPremium}):</strong> Rs {dailyRate.supplyRate}/kg</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-2 px-2 py-0.5 text-[0.75rem] cursor-pointer rounded border border-current bg-transparent hover:bg-amber-500/20 transition-colors"
            >
              Edit Rate
            </button>
          </>
        ) : (
          <>
            <span>⚠️ <strong>Aaj Ka Rate Missing Hai!</strong></span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-2 px-2.5 py-0.5 text-[0.75rem] font-semibold cursor-pointer rounded bg-amber-500 text-black border-none hover:bg-amber-400 transition-colors"
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
