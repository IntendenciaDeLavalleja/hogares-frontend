import type { NumericValue } from '../types/application'

export function parseNumber(value: string): NumericValue {
  if (value === '') return ''
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : ''
}
