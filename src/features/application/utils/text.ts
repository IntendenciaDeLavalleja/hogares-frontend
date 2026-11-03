export function sanitizeDigits(value: string, maxLength = 20): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

export function sanitizeNationalId(value: string): string {
  return value.replace(/[^0-9.-]/g, '').slice(0, 12)
}

export function isValidUruguayanId(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 8) return false
  const normalized = digits.padStart(8, '0')
  const factors = [2, 9, 8, 7, 6, 3, 4]
  const sum = factors.reduce((total, factor, index) => total + Number(normalized[index]) * factor, 0)
  return (10 - (sum % 10)) % 10 === Number(normalized[7])
}

export function isValidPersonName(value: string): boolean {
  return value.trim().length >= 2 && !/[\d<>]/.test(value)
}

export function isValidPhone(value: string): boolean {
  return /^\d{6,20}$/.test(value)
}
