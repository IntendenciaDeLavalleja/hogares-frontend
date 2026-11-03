export function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(`${birthDate}T00:00:00`)
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age >= 0 ? age : null
}
