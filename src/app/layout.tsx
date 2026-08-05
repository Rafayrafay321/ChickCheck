import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChickCheck — Dukaan POS',
  description: 'Offline-first POS for local chicken retail & wholesale business',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
