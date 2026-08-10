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
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 w-full shadow-2xl transition-all"
        style={{ maxWidth: width || maxWidth || '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="m-0 text-lg font-semibold text-text-primary">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-lg text-text-secondary cursor-pointer p-1 hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
