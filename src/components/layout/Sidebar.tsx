'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  path: string
  label: string
  labelUrdu: string
  emoji: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',  label: 'Dashboard',  labelUrdu: 'Dashboard',   emoji: '🏠' },
  { path: '/customers',  label: 'Customers',  labelUrdu: 'Grahak',     emoji: '👥' },
  { path: '/products',   label: 'Products',   labelUrdu: 'Maal',       emoji: '🐔' },
  { path: '/stock',      label: 'Stock',      labelUrdu: 'Maal Baqi',  emoji: '📦' },
  { path: '/orders',     label: 'Orders',     labelUrdu: 'Orders',     emoji: '📋' },
  { path: '/invoices',   label: 'Invoices',   labelUrdu: 'Bill',       emoji: '🧾' },
  { path: '/udhaar',     label: 'Udhaar',     labelUrdu: 'Khata',      emoji: '📒' },
  { path: '/end-of-day', label: 'End of Day', labelUrdu: 'Din Khatam', emoji: '📊' },
] as const

interface SidebarProps {
  shopName: string
}

export function Sidebar({ shopName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '240px', minHeight: '100vh', backgroundColor: 'var(--color-sidebar)',
      color: '#fff', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>🐔 {shopName}</h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Dukaan POS</p>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link key={item.path} href={item.path} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
              fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
              marginBottom: '2px', transition: 'all 0.15s ease', minHeight: '44px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
              <div>
                <div>{item.label}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{item.labelUrdu}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      <div style={{
        padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)',
      }}>
        ☁️ Sync: Not connected
      </div>
    </aside>
  )
}
