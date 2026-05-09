/** Локальный календарный день устройства в формате YYYY-MM-DD */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

/** Сдвиг локальной даты на ±n дней */
export function shiftLocalDateKey(key: string, deltaDays: number): string {
  const dt = parseLocalDateKey(key)
  if (!dt) return localDateKey()
  dt.setDate(dt.getDate() + deltaDays)
  return localDateKey(dt)
}
