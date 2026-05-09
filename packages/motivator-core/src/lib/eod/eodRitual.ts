import type { Task } from '../../vault/types'
import { isMainTaskDoneForDay } from '../recurrence'
import { localDateKey } from '../localDate'
import {
  recurrenceInstanceScheduledOnDate,
  tasksPlannedForLocalDay,
} from '../reporting/vaultAnalytics'

/** Локальный календарный день для ISO-времени задачи (createdAt / updatedAt). */
export function isoToLocalDateKey(iso: string): string {
  return localDateKey(new Date(iso))
}

/** Эвристика «активности» по дате (created/updated/план). Для списков EOD используйте {@link tasksPlannedForEodRitual}. */
export function taskActiveOnLocalCalendarDay(task: Task, dateKey: string): boolean {
  if (isoToLocalDateKey(task.createdAt) === dateKey) return true
  if (isoToLocalDateKey(task.updatedAt) === dateKey) return true
  if (task.scheduledLocalDate === dateKey) return true
  if (task.recurrence && recurrenceInstanceScheduledOnDate(task, dateKey)) return true
  return false
}

/** План на календарный день + участие в ритуале (как `tasksPlannedForLocalDay`, без ложных попаданий по `updatedAt`). */
export function tasksPlannedForEodRitual(tasks: Task[], dateKey: string): Task[] {
  return tasksPlannedForLocalDay(tasks, dateKey).filter((t) => t.includeInEodRitual !== false)
}

/** Синоним {@link tasksPlannedForEodRitual} (совместимость). */
export function tasksEligibleForEod(tasks: Task[], dateKey: string): Task[] {
  return tasksPlannedForEodRitual(tasks, dateKey)
}

/** Бэклог (разовые без даты), незавершённые — только напоминание, не блок «не закрыто за день». */
export function backlogTasksForEodReminder(tasks: Task[]): Task[] {
  return tasks
    .filter(
      (t) =>
        t.includeInEodRitual !== false &&
        !t.recurrence &&
        t.scheduledLocalDate === null &&
        !t.done,
    )
    .sort(sortByPriorityThenTitle)
}

function sortByPriorityThenTitle(a: Task, b: Task): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
}

/** Выполнено / не закрыто по плану на день; бэклог отдельным списком для мягкого блока в UI. */
export function partitionEodTasksByCompletion(
  tasks: Task[],
  dateKey: string,
): { completed: Task[]; remaining: Task[]; backlogReminder: Task[] } {
  const eligible = tasksPlannedForEodRitual(tasks, dateKey)
  const completed: Task[] = []
  const remaining: Task[] = []
  for (const t of eligible) {
    if (isMainTaskDoneForDay(t, dateKey)) completed.push(t)
    else remaining.push(t)
  }
  completed.sort(sortByPriorityThenTitle)
  remaining.sort(sortByPriorityThenTitle)
  const backlogReminder = backlogTasksForEodReminder(tasks)
  return { completed, remaining, backlogReminder }
}
