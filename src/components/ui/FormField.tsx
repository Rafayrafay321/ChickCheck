// ─── FormField Component ─────────────────────────────────────────
// Label + input/select/textarea + error message wrapper.
// Pure Tailwind — no inline style objects.

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

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-11'

const errorInputClasses =
  'w-full rounded-lg border border-red-400 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 min-h-11'

export function FormField(props: FormFieldProps) {
  const { label, error, required, hint, as = 'input', ...rest } = props

  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {as === 'select' ? (
        <select
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
          className={`${error ? errorInputClasses : inputClasses} cursor-pointer appearance-none`}
        >
          {(props as SelectFieldProps).children}
        </select>
      ) : (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          className={error ? errorInputClasses : inputClasses}
        />
      )}

      {hint && !error && (
        <span className="text-xs text-slate-400">{hint}</span>
      )}
      {error && (
        <span className="text-xs font-medium text-red-500">⚠ {error}</span>
      )}
    </div>
  )
}
