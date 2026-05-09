import { localDateKey, parseLocalDateKey, shiftLocalDateKey } from './localDate'

/** Понедельник недели, в которую входит день key (локальный календарь). */
export function startOfWeekMonday(key: string): string {
  const dt = parseLocalDateKey(key)
  if (!dt) return key
  const day = dt.getDay()
  const offsetFromMonday = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + offsetFromMonday)
  return localDateKey(dt)
}

/** Семь подряд локальных дат с понедельника weekStartMonday */
export function weekDayKeys(weekStartMonday: string): string[] {
  const out: string[] = []
  let k = weekStartMonday
  for (let i = 0; i < 7; i++) {
    out.push(k)
    k = shiftLocalDateKey(k, 1)
  }
  return out
}

/** Следующая / предыдущая неделя */
export function shiftWeekStartMonday(weekStartMonday: string, deltaWeeks: number): string {
  return shiftLocalDateKey(weekStartMonday, deltaWeeks * 7)
}

export type MonthMatrixCell = { dateKey: string } | { pad: true }

/** Матрица недель для месяца (monthIndex 0–11), ячейки — даты или пустая подложка */
export function monthWeekMatrix(year: number, monthIndex: number): MonthMatrixCell[][] {
  const first = new Date(year, monthIndex, 1)
  const last = new Date(year, monthIndex + 1, 0)
  const startPad = first.getDay()
  const padMon = startPad === 0 ? 6 : startPad - 1
  const totalDays = last.getDate()
  const cells: MonthMatrixCell[] = []

  for (let i = 0; i < padMon; i++) cells.push({ pad: true })

  for (let d = 1; d <= totalDays; d++) {
    cells.push({ dateKey: localDateKey(new Date(year, monthIndex, d)) })
  }

  while (cells.length % 7 !== 0) cells.push({ pad: true })

  const rows: MonthMatrixCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  return rows
}

export function monthLabel(year: number, monthIndex: number, locale: string): string {
  try {
    return new Date(year, monthIndex, 1).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return `${year}-${monthIndex + 1}`
  }
}
