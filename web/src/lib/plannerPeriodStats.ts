import {
  isPlannedTaskFullyCompleteForDay,
  tasksScheduledForPlannerDay,
  type Task,
} from '@motivator/core'
import { getAppNow } from '@/lib/appNow'
import { isPlannerTaskOverdue } from '@/lib/plannerTaskDayStatus'

export type PlannerDaySummary = {
  total: number
  done: number
  overdue: number
}

export function summarizePlannerDay(
  tasks: Task[],
  dayKey: string,
  todayKey: string,
): PlannerDaySummary {
  const dayTasks = tasksScheduledForPlannerDay(tasks, dayKey)
  let done = 0
  let overdue = 0
  for (const task of dayTasks) {
    if (isPlannedTaskFullyCompleteForDay(task, dayKey)) done += 1
    else if (isPlannerTaskOverdue(task, dayKey, todayKey, getAppNow())) overdue += 1
  }
  return { total: dayTasks.length, done, overdue }
}

export function countOverdueInDays(tasks: Task[], dayKeys: string[], todayKey: string): number {
  let count = 0
  for (const dayKey of dayKeys) {
    if (dayKey > todayKey) continue
    for (const task of tasksScheduledForPlannerDay(tasks, dayKey)) {
      if (isPlannerTaskOverdue(task, dayKey, todayKey, getAppNow())) count += 1
    }
  }
  return count
}

export function countHiddenByFilterInDays(
  allTasks: Task[],
  visibleTasks: Task[],
  dayKeys: string[],
): number {
  let hidden = 0
  for (const dayKey of dayKeys) {
    const all = tasksScheduledForPlannerDay(allTasks, dayKey)
    const visible = new Set(tasksScheduledForPlannerDay(visibleTasks, dayKey).map((t) => t.id))
    hidden += all.filter((t) => !visible.has(t.id)).length
  }
  return hidden
}
