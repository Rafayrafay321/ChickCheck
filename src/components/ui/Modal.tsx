'use client'

import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  width?: string
  maxWidth?: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, width, maxWidth, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-xl transition-all"
        style={{ maxWidth: width || maxWidth || '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="m-0 text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
