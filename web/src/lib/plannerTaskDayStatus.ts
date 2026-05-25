import {
  getTaskSlotMinutes,
  isPlannedTaskFullyCompleteForDay,
  type Task,
} from '@motivator/core'

/** Слот задачи на `dayKey` уже прошёл (только для сегодня, при заданном времени). */
export function isTaskTimeSlotPassedOnDay(
  task: Task,
  dayKey: string,
  todayKey: string,
  now: Date = new Date(),
): boolean {
  if (dayKey !== todayKey) return false
  const slot = getTaskSlotMinutes(task, dayKey)
  if (!slot) return false
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes >= slot.end
}

/** Незакрытая задача в прошлом дне или с прошедшим слотом сегодня. */
export function isPlannerTaskOverdue(
  task: Task,
  dayKey: string,
  todayKey: string,
  now?: Date,
): boolean {
  if (isPlannedTaskFullyCompleteForDay(task, dayKey)) return false
  if (dayKey < todayKey) return true
  return isTaskTimeSlotPassedOnDay(task, dayKey, todayKey, now)
}
