import type { Task } from '../../vault/types'
import { isMainTaskDoneForDay } from '../recurrence'
import { localDateKey } from '../localDate'
import { recurrenceInstanceScheduledOnDate } from '../reporting/vaultAnalytics'

/** Локальный календарный день для ISO-времени задачи (createdAt / updatedAt). */
export function isoToLocalDateKey(iso: string): string {
  return localDateKey(new Date(iso))
}

/**
 * Задача «активна» в указанный календарный день по [[DR-002]]:
 * создана / изменена в этот день или имела план (слот повтора или разовая дата) на этот день.
 */
export function taskActiveOnLocalCalendarDay(task: Task, dateKey: string): boolean {
  if (isoToLocalDateKey(task.createdAt) === dateKey) return true
  if (isoToLocalDateKey(task.updatedAt) === dateKey) return true
  if (task.scheduledLocalDate === dateKey) return true
  if (task.recurrence && recurrenceInstanceScheduledOnDate(task, dateKey)) return true
  return false
}

/** Отбор задач для ритуала: флаг участия + активность за день ([[DR-002]]). */
export function tasksEligibleForEod(tasks: Task[], dateKey: string): Task[] {
  return tasks.filter(
    (t) => t.includeInEodRitual !== false && taskActiveOnLocalCalendarDay(t, dateKey),
  )
}

function sortByPriorityThenTitle(a: Task, b: Task): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
}

/**
 * Разделение на выполненные и оставшиеся за день — порядок DR-002:
 * сначала блок «выполнено», затем «не выполнено».
 */
export function partitionEodTasksByCompletion(
  tasks: Task[],
  dateKey: string,
): { completed: Task[]; remaining: Task[] } {
  const eligible = tasksEligibleForEod(tasks, dateKey)
  const completed: Task[] = []
  const remaining: Task[] = []
  for (const t of eligible) {
    if (isMainTaskDoneForDay(t, dateKey)) completed.push(t)
    else remaining.push(t)
  }
  completed.sort(sortByPriorityThenTitle)
  remaining.sort(sortByPriorityThenTitle)
  return { completed, remaining }
}
