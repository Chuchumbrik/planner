import type { Task } from '../../vault/types'
import { calendarDaysBetween } from '../recurrence'
import { localDateKey, parseLocalDateKey, shiftLocalDateKey } from '../localDate'

/**
 * Вхождение по правилам повтора (без учёта галочки на конкретный день) —
 * «в этот день по расписанию был бы слот задачи».
 * Учитывает `task.done` (архив серии / разовой задачи).
 */
export function recurrenceInstanceScheduledOnDate(task: Task, dateKey: string): boolean {
  if (task.done) return false

  if (!task.recurrence) {
    return task.scheduledLocalDate === dateKey
  }

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

/** Есть ли отметка выполнения для этого календарного дня. */
export function taskCompletedOnLocalDay(task: Task, dateKey: string): boolean {
  if (task.recurrence) {
    return (task.completedOccurrenceLocalDates ?? []).includes(dateKey)
  }
  return Boolean(task.done && task.scheduledLocalDate === dateKey)
}

/** Пропуск вхождения: слот был по расписанию, день уже прошёл, отметки на этот день нет. */
export function isMissedOccurrenceOnDate(task: Task, dateKey: string, todayKey: string): boolean {
  if (dateKey >= todayKey) return false
  if (!recurrenceInstanceScheduledOnDate(task, dateKey)) return false
  if (taskCompletedOnLocalDay(task, dateKey)) return false
  return true
}

export function eachDateKeyInRangeInclusive(
  fromKey: string,
  toKey: string,
  callback: (dateKey: string) => void,
): void {
  if (fromKey > toKey) return
  let k = fromKey
  for (;;) {
    callback(k)
    if (k === toKey) break
    k = shiftLocalDateKey(k, 1)
  }
}

/** Число пропущенных вхождений задачи на интервале дат [fromKey, toKey] включительно (дата < todayKey). */
export function countMissedOccurrencesInRange(
  task: Task,
  fromKey: string,
  toKey: string,
  todayKey: string,
): number {
  let n = 0
  eachDateKeyInRangeInclusive(fromKey, toKey, (d) => {
    if (isMissedOccurrenceOnDate(task, d, todayKey)) n += 1
  })
  return n
}

export type DailyCompletionBucket = { dateKey: string; count: number }

/** Сколько задач «закрыто» в каждый день: повторы — по completedOccurrenceLocalDates; разовые — done и scheduledLocalDate. */
export function dailyCompletionBuckets(
  tasks: Task[],
  fromKey: string,
  toKey: string,
): DailyCompletionBucket[] {
  const map = new Map<string, number>()
  eachDateKeyInRangeInclusive(fromKey, toKey, (d) => map.set(d, 0))

  for (const task of tasks) {
    if (task.recurrence) {
      const dates = task.completedOccurrenceLocalDates ?? []
      for (const dk of dates) {
        if (dk >= fromKey && dk <= toKey && map.has(dk)) {
          map.set(dk, (map.get(dk) ?? 0) + 1)
        }
      }
    } else if (task.done && task.scheduledLocalDate) {
      const dk = task.scheduledLocalDate
      if (dk >= fromKey && dk <= toKey && map.has(dk)) {
        map.set(dk, (map.get(dk) ?? 0) + 1)
      }
    }
  }

  const out: DailyCompletionBucket[] = []
  eachDateKeyInRangeInclusive(fromKey, toKey, (d) => {
    out.push({ dateKey: d, count: map.get(d) ?? 0 })
  })
  return out
}

export function dayHasCompletionFromVault(tasks: Task[], dateKey: string): boolean {
  for (const task of tasks) {
    if (taskCompletedOnLocalDay(task, dateKey)) return true
  }
  return false
}

/**
 * Подряд идущих календарных дней, заканчивающихся на `lastDayKey`, где была хотя бы одна отметка выполнения
 * (по данным vault; без ритуала End-of-Day — см. DR-013).
 */
export function consecutiveCompletionDaysEndingOn(tasks: Task[], lastDayKey: string): number {
  let streak = 0
  let d = lastDayKey
  for (;;) {
    if (!dayHasCompletionFromVault(tasks, d)) break
    streak += 1
    d = shiftLocalDateKey(d, -1)
  }
  return streak
}

/** Доля дней в интервале [fromKey,toKey], в которые была ≥1 отметка выполнения. */
export function completionDayRate(
  tasks: Task[],
  fromKey: string,
  toKey: string,
): { totalDays: number; daysWithCompletion: number; ratio: number } {
  let daysWithCompletion = 0
  let totalDays = 0
  eachDateKeyInRangeInclusive(fromKey, toKey, (d) => {
    totalDays += 1
    if (dayHasCompletionFromVault(tasks, d)) daysWithCompletion += 1
  })
  const ratio = totalDays === 0 ? 0 : daysWithCompletion / totalDays
  return { totalDays, daysWithCompletion, ratio }
}

export type RecurringMissAggregate = {
  seriesId: string
  task: Task
  missedCount: number
}

/** DR-008: группировка по серии повтора — одна строка на шаблон. */
export function aggregateRecurringMisses(
  tasks: Task[],
  fromKey: string,
  toKey: string,
  todayKey: string,
): RecurringMissAggregate[] {
  const rows: RecurringMissAggregate[] = []
  for (const task of tasks) {
    if (!task.recurrence || task.done) continue
    const n = countMissedOccurrencesInRange(task, fromKey, toKey, todayKey)
    if (n > 0) rows.push({ seriesId: task.id, task, missedCount: n })
  }
  rows.sort((a, b) => b.missedCount - a.missedCount || a.task.title.localeCompare(b.task.title))
  return rows
}

export type OneOffOverdue = {
  task: Task
  /** Оценка «давности» провала — дата плана в прошлом */
  scheduledLocalDate: string
}

/**
 * DR-008: разовые задачи — топ по провалам за окно (в модели одна просрочка на задачу;
 * сортируем по самой ранней дате плана среди просроченных в окне).
 */
export function topOneOffMissesInWindow(
  tasks: Task[],
  fromKey: string,
  toKey: string,
  todayKey: string,
  limit: number,
): OneOffOverdue[] {
  const rows: OneOffOverdue[] = []
  for (const task of tasks) {
    if (task.recurrence || task.done) continue
    const sd = task.scheduledLocalDate
    if (!sd || sd >= todayKey) continue
    if (sd < fromKey || sd > toKey) continue
    rows.push({ task, scheduledLocalDate: sd })
  }
  rows.sort((a, b) => a.scheduledLocalDate.localeCompare(b.scheduledLocalDate))
  return rows.slice(0, limit)
}

/** Суммарное число отметок «выполнено» за интервал (повторы по дням + разовые). */
export function totalCompletionMarksInRange(tasks: Task[], fromKey: string, toKey: string): number {
  let sum = 0
  const buckets = dailyCompletionBuckets(tasks, fromKey, toKey)
  for (const b of buckets) sum += b.count
  return sum
}

export function reportsWindowKeys(
  periodDays: number,
  today: Date = new Date(),
): { todayKey: string; fromKey: string; toKey: string } {
  const todayKey = localDateKey(today)
  const toKey = shiftLocalDateKey(todayKey, -1)
  const fromKey = shiftLocalDateKey(toKey, -(periodDays - 1))
  return { todayKey, fromKey, toKey }
}
