'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Root page — redirects to /login or /dashboard based on auth state
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('shopName')) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return null
}
