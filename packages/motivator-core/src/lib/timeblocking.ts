import { taskOccursOnDate } from './recurrence'
import type { Task } from '../vault/types'

/** Если оценки нет — используем для визуализации и пересечений (минуты). */
export const DEFAULT_SLOT_DURATION_MIN = 30

/**
 * Интервал задачи на календарном дне в минутах от полуночи [start, end).
 * null — нет отображаемого слота (нет даты, нет времени, выполнено и скрываем и т.д.).
 */
export function getTaskSlotMinutes(
  task: Task,
  occurrenceDayKey?: string,
): { start: number; end: number } | null {
  if (task.done) return null
  const dayKey = occurrenceDayKey ?? task.scheduledLocalDate
  if (!dayKey) return null
  if (occurrenceDayKey && !taskOccursOnDate(task, occurrenceDayKey)) return null

  const est = task.estimatedMinutes ?? DEFAULT_SLOT_DURATION_MIN
  if (task.timeMode === 'start' && task.timeMinutesFromMidnight != null) {
    const s = task.timeMinutesFromMidnight
    const e = s + est
    return { start: s, end: Math.min(e, 24 * 60) }
  }

  if (task.timeMode === 'end' && task.timeMinutesFromMidnight != null) {
    const e = task.timeMinutesFromMidnight
    const s = Math.max(0, e - est)
    return { start: s, end: e }
  }

  return null
}

/** Длина пересечения двух замкнутых интервалов [start,end) на одной оси минут */
export function overlapRangeMinutes(
  a: { start: number; end: number },
  b: { start: number; end: number },
): number {
  const lo = Math.max(a.start, b.start)
  const hi = Math.min(a.end, b.end)
  return Math.max(0, hi - lo)
}

/** Пересечение слотов двух задач в один календарный день (минуты). */
export function overlapTasksMinutes(a: Task, b: Task, dayKey: string): number {
  if (a.id === b.id) return 0
  if (!taskOccursOnDate(a, dayKey) || !taskOccursOnDate(b, dayKey)) return 0
  const sa = getTaskSlotMinutes(a, dayKey)
  const sb = getTaskSlotMinutes(b, dayKey)
  if (!sa || !sb) return 0
  return overlapRangeMinutes(sa, sb)
}

/** Максимальная длина пересечения слота task с любой из others в указанный день. */
export function maxOverlapWithOthers(task: Task, others: Task[], dayKey: string): number {
  let max = 0
  for (const o of others) {
    if (o.id === task.id) continue
    max = Math.max(max, overlapTasksMinutes(task, o, dayKey))
  }
  return max
}

/** Сводная задача после точечного патча (без записи в vault). */
export function withTaskPatch(task: Task, patch: Partial<Task>): Task {
  return { ...task, ...patch }
}
