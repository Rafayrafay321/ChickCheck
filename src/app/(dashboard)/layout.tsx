'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

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

  // Don't render until auth is verified
  if (!shopName) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar shopName={shopName} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '56px', backgroundColor: 'var(--color-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: '16px',
        }}>
          <button onClick={handleLogout} style={{
            padding: '6px 16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent', border: '1px solid var(--color-border)',
            borderRadius: '6px', cursor: 'pointer',
          }}>
            Logout
          </button>
        </header>

        <main style={{
          flex: 1, overflow: 'auto', padding: '24px', backgroundColor: 'var(--color-bg)',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
