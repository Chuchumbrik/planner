/** Часы:минуты для native `<input type="time">` */
export function minutesToTimeInput(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function timeInputToMinutes(v: string): number | null {
  if (!v.trim()) return null
  const [hs, ms] = v.split(':')
  const h = Number(hs)
  const min = Number(ms)
  if (Number.isNaN(h) || Number.isNaN(min)) return null
  const total = h * 60 + min
  if (total < 0 || total > 1439) return null
  return total
}
