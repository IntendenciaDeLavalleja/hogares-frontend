import { cloneElement, isValidElement } from 'react'
import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface BaseProps { id: string; label: string; hint?: string; error?: string; required?: boolean; children?: ReactNode }

export function FormField({ id, label, hint, error, required, children }: BaseProps) {
  return (
    <div className="form-control w-full">
      <label className="label cursor-text" htmlFor={id}><span className="label-text font-medium">{label}{required && <span className="ml-1 text-error" aria-hidden="true">*</span>}</span></label>
      {required && isValidElement<{ required?: boolean }>(children) ? cloneElement(children, { required: true }) : children}
      {hint && !error && <p className="mt-1 text-xs text-base-content/55">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-error" role="alert">{error}</p>}
    </div>
  )
}

export function Input({ error, onChange, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (props.type === 'number') {
      const value = event.currentTarget.value
      const allowsDecimals = props.step !== undefined && props.step !== '1' && props.step !== 1
      const validNumber = allowsDecimals ? /^\d*(\.\d*)?$/.test(value) : /^\d*$/.test(value)
      if (!validNumber) return
    }
    onChange?.(event)
  }

  return <input {...props} onChange={handleChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${props.id}-error` : undefined} className={`input input-bordered w-full bg-base-100 ${error ? 'input-error' : ''} ${props.className ?? ''}`} />
}

export function Select({ error, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return <select {...props} aria-invalid={Boolean(error)} aria-describedby={error ? `${props.id}-error` : undefined} className={`select select-bordered w-full bg-base-100 ${error ? 'select-error' : ''} ${props.className ?? ''}`}>{children}</select>
}

export function Textarea({ error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea {...props} aria-invalid={Boolean(error)} aria-describedby={error ? `${props.id}-error` : undefined} className={`textarea textarea-bordered w-full bg-base-100 ${error ? 'textarea-error' : ''} ${props.className ?? ''}`} />
}

export function YesNo({ id, label, value, onChange, error }: { id: string; label: string; value: boolean | null; onChange: (value: boolean) => void; error?: string }) {
  return <fieldset className="form-control"><legend className="label pb-1"><span className="label-text font-medium">{label}</span></legend><div className="flex flex-wrap gap-2" id={id} aria-describedby={error ? `${id}-error` : undefined}>{[true, false].map((option) => <label key={String(option)} className={`choice-pill ${value === option ? 'choice-pill-selected' : ''}`}><input type="radio" name={id} className="sr-only" checked={value === option} onChange={() => onChange(option)} />{option ? 'Sí' : 'No'}</label>)}</div>{error && <p id={`${id}-error`} className="mt-1 text-xs text-error" role="alert">{error}</p>}</fieldset>
}
