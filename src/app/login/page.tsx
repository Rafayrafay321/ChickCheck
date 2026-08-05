'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Setup form state
  const [isSetup, setIsSetup] = useState(false)
  const [setupName, setSetupName] = useState('')
  const [setupShopName, setSetupShopName] = useState('')
  const [setupPhone, setSetupPhone] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('shopName')) {
      router.replace('/dashboard')
      return
    }
    // Check if owner exists
    api.checkOwnerExists().then((res) => {
      if (res.success && !res.data) setIsSetup(true)
      setChecked(true)
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await api.login(password)
      if (result.success && result.data) {
        const ownerData = result.data as { shopName: string }
        localStorage.setItem('shopName', ownerData.shopName)
        router.push('/dashboard')
      } else {
        setError(result.error ?? 'Galat Password')
      }
    } catch {
      setError('Kuch galat ho gaya')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await api.setupOwner({
        name: setupName,
        shopName: setupShopName,
        phone: setupPhone || undefined,
        password: setupPassword,
      })
      if (result.success) {
        localStorage.setItem('shopName', setupShopName)
        router.push('/dashboard')
      } else {
        setError(result.error ?? 'Setup nahi ho saka')
      }
    } catch {
      setError('Kuch galat ho gaya')
    } finally {
      setIsLoading(false)
    }
  }

  if (!checked) return null

  const containerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', backgroundColor: 'var(--color-bg)',
  }
  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: '400px', backgroundColor: 'var(--color-card)',
    borderRadius: '16px', padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--color-border)',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', fontSize: '0.95rem',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)',
    marginTop: '6px', minHeight: '44px',
  }
  const buttonStyle: React.CSSProperties = {
    width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600,
    color: '#fff', backgroundColor: 'var(--color-primary)', border: 'none',
    borderRadius: '8px', cursor: 'pointer', minHeight: '44px', marginTop: '16px',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.85rem', fontWeight: 500,
    color: 'var(--color-text-secondary)', marginTop: '16px',
  }

  if (isSetup) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '3rem' }}>🐔</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '8px' }}>Dukaan Setup</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Pehli baar? Apni dukaan ka naam aur password set karo
            </p>
          </div>
          <form onSubmit={handleSetup}>
            <label style={labelStyle}>Apna Naam
              <input type="text" value={setupName} onChange={e => setSetupName(e.target.value)}
                placeholder="e.g. Abdul Rafay" required style={inputStyle} />
            </label>
            <label style={labelStyle}>Dukaan ka Naam
              <input type="text" value={setupShopName} onChange={e => setSetupShopName(e.target.value)}
                placeholder="e.g. Rafay Chicken" required style={inputStyle} />
            </label>
            <label style={labelStyle}>Phone (Optional)
              <input type="text" value={setupPhone} onChange={e => setSetupPhone(e.target.value)}
                placeholder="e.g. 0300-1234567" style={inputStyle} />
            </label>
            <label style={labelStyle}>Password
              <input type="password" value={setupPassword} onChange={e => setSetupPassword(e.target.value)}
                placeholder="Password set karo" required style={inputStyle} />
            </label>
            {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}
            <button type="submit" disabled={isLoading} style={buttonStyle}>
              {isLoading ? 'Wait karo...' : 'Shuru Karo ✅'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '3rem' }}>🐔</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '8px' }}>Dukaan POS</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            Password daalo aur shuru karo
          </p>
        </div>
        <form onSubmit={handleLogin}>
          <label style={labelStyle}>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Apna password daalo" required autoFocus style={inputStyle} />
          </label>
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}
          <button type="submit" disabled={isLoading} style={buttonStyle}>
            {isLoading ? 'Wait karo...' : 'Login Karo 🔑'}
          </button>
        </form>
      </div>
    </div>
  )
}
