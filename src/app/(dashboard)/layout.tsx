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
    <div className="flex h-screen overflow-hidden bg-bg text-text-primary">
      <Sidebar shopName={shopName} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 gap-4">
          <div className="flex flex-1 items-center">
            <DailyRateBanner />
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-xs text-text-secondary bg-transparent border border-border rounded-md hover:bg-bg transition-colors cursor-pointer"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-bg">
          {children}
        </main>
      </div>
    </div>
  )
}
