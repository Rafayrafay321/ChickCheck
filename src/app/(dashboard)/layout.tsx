'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { DailyRateBanner } from '@/components/layout/DailyRateBanner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [shopName, setShopName] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('shopName')
    if (!stored) {
      router.replace('/login')
    } else {
      setShopName(stored)
    }
  }, [router])

  function handleLogout() {
    localStorage.removeItem('shopName')
    router.replace('/login')
  }

  if (!shopName) return null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar shopName={shopName} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 gap-4 shrink-0">
          <div className="flex flex-1 items-center">
            <DailyRateBanner />
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] cursor-pointer"
          >Logout</button>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
