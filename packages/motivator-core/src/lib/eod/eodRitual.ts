import type { Task } from '../../vault/types'
import { isMainTaskDoneForDay, taskHasOccurrenceOnDate } from '../recurrence'
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

/** Результат расчёта прогресса плана на день для UI (доля по задачам). */
export type PlannedDayProgress = {
  /** Сумма вкладов задач в [0, 1]: без чек-листа — 0 или 1; с чек-листом — доля отмеченных пунктов. */
  doneFraction: number
  /** Число задач в плане (каждая задаёт до 1 в знаменатель). */
  plannedTaskCount: number
}

function taskCompletionFractionForDay(task: Task, dateKey: string): number {
  const items = task.checklist ?? []
  if (items.length === 0) {
    return isMainTaskDoneForDay(task, dateKey) ? 1 : 0
  }
  const done = items.filter((i) => i.done).length
  if (done === items.length && !isMainTaskDoneForDay(task, dateKey)) {
    /** Кольцо прогресса: не показывать «100%» по чек-листу, пока не отмечена главная галочка дня. */
    return 0.99
  }
  return done / items.length
}

/** Доля «сделано» для строки плана на день (как у кольца прогресса): 0…1. */
export function plannedTaskCompletionFractionForDay(task: Task, dateKey: string): number {
  return taskCompletionFractionForDay(task, dateKey)
}

/** Полностью закрыта по плану на этот календарный день: чек-лист (если есть) + главная отметка дня. */
export function isPlannedTaskFullyCompleteForDay(task: Task, dateKey: string): boolean {
  const items = task.checklist ?? []
  if (items.length === 0) return isMainTaskDoneForDay(task, dateKey)
  if (!items.every((i) => i.done)) return false
  return isMainTaskDoneForDay(task, dateKey)
}

/**
 * Прогресс плана на календарный день: **каждая задача** даёт до **1** в сумме «знаменателя».
 * Без чек-листа — 0 или 1 по главной отметке дня; с чек-листом — доля выполненных пунктов (1 из 4 → **0,25** от этой задачи).
 */
export function plannedDayCompletionWeights(
  plannedTasksForDay: Task[],
  dateKey: string,
): PlannedDayProgress {
  let doneFraction = 0
  for (const t of plannedTasksForDay) {
    doneFraction += taskCompletionFractionForDay(t, dateKey)
  }
  return { doneFraction, plannedTaskCount: plannedTasksForDay.length }
}

/**
 * Задачи с вхождением на календарный день — то же правило, что список «План на день» в веб-клиенте
 * (`scheduledLocalDate` / повтор, без бэклога).
 */
export function tasksScheduledForPlannerDay(tasks: Task[], dateKey: string): Task[] {
  return tasks.filter((x) => {
    if (x.scheduledLocalDate === null && !x.recurrence) return false
    return taskHasOccurrenceOnDate(x, dateKey)
  })
}

/**
 * Прогресс за **несколько календарных дней**: суммируются те же доли, что {@link plannedDayCompletionWeights}
 * по каждому дню. Учитываются только даты **`dayKey <= todayKey`** (будущие дни периода не раздувают знаменатель).
 */
export function plannedPeriodProgress(
  tasks: Task[],
  periodDayKeys: string[],
  todayKey: string,
): PlannedDayProgress {
  let doneFraction = 0
  let plannedTaskCount = 0
  for (const d of periodDayKeys) {
    if (d > todayKey) continue
    const planned = tasksScheduledForPlannerDay(tasks, d)
    const w = plannedDayCompletionWeights(planned, d)
    doneFraction += w.doneFraction
    plannedTaskCount += w.plannedTaskCount
  }
  return { doneFraction, plannedTaskCount }
}

/** Сводка «слотов» плана за период по полю задачи (для диаграмм в UI). */
export type PeriodPlanSlotBucket = {
  key: string
  /** Сумма {@link taskCompletionFractionForDay} по всем (день × задача в плане) в бакете. */
  doneFractionSum: number
  /** Число вхождений задачи в плане на день в периоде (знаменатель для доли). */
  slotCount: number
}

function accumulatePeriodPlanSlots(
  tasks: Task[],
  periodDayKeys: string[],
  todayKey: string,
  bucketKey: (t: Task) => string,
): PeriodPlanSlotBucket[] {
  const map = new Map<string, { done: number; n: number }>()
  for (const d of periodDayKeys) {
    if (d > todayKey) continue
    for (const t of tasksScheduledForPlannerDay(tasks, d)) {
      const k = bucketKey(t)
      const cur = map.get(k) ?? { done: 0, n: 0 }
      cur.done += taskCompletionFractionForDay(t, d)
      cur.n += 1
      map.set(k, cur)
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      doneFractionSum: v.done,
      slotCount: v.n,
    }))
    .sort((a, b) => b.slotCount - a.slotCount)
}

export function plannedPeriodSlotsByGroupId(
  tasks: Task[],
  periodDayKeys: string[],
  todayKey: string,
): PeriodPlanSlotBucket[] {
  return accumulatePeriodPlanSlots(tasks, periodDayKeys, todayKey, (t) => t.groupId)
}

export function plannedPeriodSlotsByColorKey(
  tasks: Task[],
  periodDayKeys: string[],
  todayKey: string,
): PeriodPlanSlotBucket[] {
  return accumulatePeriodPlanSlots(tasks, periodDayKeys, todayKey, (t) => t.colorKey)
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
