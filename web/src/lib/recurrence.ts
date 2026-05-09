import { parseLocalDateKey } from '@/lib/localDate'
import type { Task } from '@/vault/types'

/** Разница в календарных днях между двумя датами YYYY-MM-DD (локально). */
export function calendarDaysBetween(anchorKey: string, dateKey: string): number {
  const a = parseLocalDateKey(anchorKey)
  const b = parseLocalDateKey(dateKey)
  if (!a || !b) return 0
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / 86400000)
}

export function normalizeWeekdays(raw: number[]): number[] {
  const s = new Set<number>()
  for (const x of raw) {
    if (x >= 0 && x <= 6) s.add(x)
  }
  return [...s].sort((a, b) => a - b)
}

/** Задача «видна» в этот календарный день (план и календарь). */
export function taskOccursOnDate(task: Task, dateKey: string): boolean {
  if (task.done) return false

  if (!task.recurrence) {
    return task.scheduledLocalDate === dateKey
  }

  const anchor = task.recurrenceAnchorLocalDate
  if (!anchor) return false

  if (dateKey < anchor) return false

  const rule = task.recurrence
  if (rule.kind === 'daily') {
    return true
  }

  if (rule.kind === 'everyNDays') {
    const n = Math.max(1, Math.floor(rule.n))
    const d = calendarDaysBetween(anchor, dateKey)
    return d >= 0 && d % n === 0
  }

  if (rule.kind === 'weekly') {
    const dt = parseLocalDateKey(dateKey)
    if (!dt) return false
    const wd = dt.getDay()
    return rule.weekdays.includes(wd)
  }

  return false
}

/** Серия для отчётов: стабильный id из правила повтора и якоря */
export function recurrenceSeriesId(task: Task): string | null {
  if (!task.recurrence || !task.recurrenceAnchorLocalDate) return null
  return `${task.recurrenceAnchorLocalDate}:${JSON.stringify(task.recurrence)}:${task.title.slice(0, 40)}`
}
