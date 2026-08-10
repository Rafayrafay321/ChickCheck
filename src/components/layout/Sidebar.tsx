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
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/[0.08]">
        <h1 className="text-lg font-bold text-white tracking-tight m-0">🐔 {shopName}</h1>
        <p className="text-[0.7rem] text-slate-400 mt-1 font-medium">Dukaan POS System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 pr-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3.5 px-4 py-2.5 text-sm transition-all ${
                isActive
                  ? 'bg-white/10 text-white border-l-4 border-blue-500 rounded-r-lg font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent rounded-r-lg'
              }`}
            >
              <span className="text-base shrink-0">{item.emoji}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{item.label}</div>
                <div className={`text-[0.7rem] truncate ${isActive ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                  {item.labelUrdu}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/[0.08] text-[0.7rem] text-slate-400 font-medium">
        ☁️ Sync: Not connected
      </div>
    </aside>
  )
}
