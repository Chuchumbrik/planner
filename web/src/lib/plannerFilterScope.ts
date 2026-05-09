import { taskHasOccurrenceOnDate, type Task } from '@motivator/core'

export type PlannerViewTab = 'day' | 'week' | 'month'

/** Задачи, которые могут отображаться во вкладке планировщика при открытых фильтрах «все»: день (план + бэклог), неделя (слоты по дням недели), месяц (попадание в любой день месяца). */
export function tasksVisibleInPlannerView(
  tasks: Task[],
  view: PlannerViewTab,
  opts: {
    selectedDay: string
    weekDays: string[]
    monthYear: number
    monthIndex: number
  },
): Task[] {
  if (view === 'day') {
    return tasks.filter((t) => {
      if (!t.recurrence && t.scheduledLocalDate === null) return true
      return taskHasOccurrenceOnDate(t, opts.selectedDay)
    })
  }
  if (view === 'week') {
    return tasks.filter((t) =>
      opts.weekDays.some((d) => taskHasOccurrenceOnDate(t, d)),
    )
  }
  const { monthYear, monthIndex } = opts
  const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate()
  const keys: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    keys.push(
      `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    )
  }
  return tasks.filter((t) => keys.some((k) => taskHasOccurrenceOnDate(t, k)))
}
