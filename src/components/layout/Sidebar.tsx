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
  { path: '/expenses',   label: 'Expenses',   labelUrdu: 'Kharchay',   emoji: '💸' },
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
    <aside className="w-60 min-h-screen bg-sidebar text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold m-0">🐔 {shopName}</h1>
        <p className="text-xs text-text-secondary mt-1">Dukaan POS</p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-11 ${
                isActive
                  ? 'bg-primary text-white font-semibold'
                  : 'text-white/70 hover:bg-white/5 hover:text-white font-normal'
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <div>
                <div>{item.label}</div>
                <div className="text-[0.7rem] opacity-60">{item.labelUrdu}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="p-5 border-t border-white/10 text-xs text-white/50">
        ☁️ Sync: Not connected
      </div>
    </aside>
  )
}
