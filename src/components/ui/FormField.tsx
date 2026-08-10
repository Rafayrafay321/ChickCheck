// ─── FormField Component ─────────────────────────────────────────
// Label + input/select/textarea + error message wrapper.
// Ensures consistent spacing, sizing, and error styling across all forms.

import { type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'

interface BaseFieldProps {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

interface InputFieldProps extends BaseFieldProps, InputHTMLAttributes<HTMLInputElement> {
  as?: 'input'
}

interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  as: 'select'
  children: React.ReactNode
}

type FormFieldProps = InputFieldProps | SelectFieldProps

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '0.9rem',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  backgroundColor: '#fff',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  minHeight: '44px',
  boxSizing: 'border-box',
}

export function FormField(props: FormFieldProps) {
  const { label, error, required, hint, as = 'input', ...rest } = props

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label !== undefined && (
        <label style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      {as === 'select' ? (
        <select
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
          style={{
            ...fieldStyle,
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            cursor: 'pointer',
          }}
        >
          {(props as SelectFieldProps).children}
        </select>
      ) : (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          style={{
            ...fieldStyle,
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
          }}
        />
      )}

      {hint && !error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500 }}>
          ⚠ {error}
        </span>
      )}
    </div>
  )
}
