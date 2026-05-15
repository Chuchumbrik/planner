import { parseLocalDateKey } from './localDate'
import type { Task } from '../vault/types'

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

/** Основная галочка «выполнено» для календарного дня (повтор — по вхождению, иначе task.done). */
export function isMainTaskDoneForDay(task: Task, dateKey: string): boolean {
  if (!task.recurrence) return task.done
  return (task.completedOccurrenceLocalDates ?? []).includes(dateKey)
}

/**
 * Совпадает ли правило повтора с календарным днём (без учёта отметок выполнения).
 * Для неповторяющихся задач не используется.
 */
export function recurrenceRuleMatchesDate(task: Task, dateKey: string): boolean {
  if (!task.recurrence) return false
  const anchor = task.recurrenceAnchorLocalDate
  if (!anchor || dateKey < anchor) return false

  const rule = task.recurrence
  if (rule.kind === 'daily') return true

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

/**
 * Есть ли у задачи слот на календарный день — **включая** уже выполненное вхождение повтора
 * и выполненную разовую задачу с этой датой в плане (для списков «выполненные внизу»).
 */
export function isOccurrenceSkippedOnDate(task: Task, dateKey: string): boolean {
  return (task.skippedOccurrenceLocalDates ?? []).includes(dateKey)
}

export function taskHasOccurrenceOnDate(task: Task, dateKey: string): boolean {
  if (task.recurrence) {
    if (task.done) return false
    if (isOccurrenceSkippedOnDate(task, dateKey)) return false
    return recurrenceRuleMatchesDate(task, dateKey)
  }
  return task.scheduledLocalDate === dateKey
}

/** Задача «активна» в этот день (ещё не выполнена за этот день / этот слот). */
export function taskOccursOnDate(task: Task, dateKey: string): boolean {
  if (!taskHasOccurrenceOnDate(task, dateKey)) return false
  if (!task.recurrence) return !task.done
  return !(task.completedOccurrenceLocalDates ?? []).includes(dateKey)
}

/**
 * Идентификатор серии повторов для отчётов и агрегаций (**DR-008**): одна сущность Task в vault
 * представляет всю серию; ключ группировки стабилен при смене заголовка и совпадает с `task.id`.
 */
export function recurrenceSeriesId(task: Task): string | null {
  if (!task.recurrence || !task.recurrenceAnchorLocalDate) return null
  return task.id
}
