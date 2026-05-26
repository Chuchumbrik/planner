import type { TFunction } from 'i18next'
import { timeInputToMinutes, type TaskTimeMode } from '@motivator/core'
import { appLocalDateKey, getAppNow } from '@/lib/appNow'
import { mergeEstimateParts, normalizeEstimatePair } from '@/lib/fieldSanitize'

export const MINUTES_PER_DAY = 24 * 60

/** Поля для проверки даты/времени/оценки (создание и редактирование). */
export type TaskScheduleValidationFields = {
  backlogOnly: boolean
  scheduledLocalDate: string | null
  timeMode: TaskTimeMode
  /** HH:mm при timeMode !== 'none' */
  timeClock: string
  estimatedHours: string
  estimatedMinutesPart: string
  plannedWithEstimateRequired: boolean
}

export function clockMinutesFromScheduleFields(f: TaskScheduleValidationFields): number | null {
  if (f.timeMode === 'none') return null
  let m = timeInputToMinutes(f.timeClock.trim())
  if (m == null) m = f.timeMode === 'start' ? 9 * 60 : 18 * 60
  return m
}

/** Блокирующие ошибки: прошлая дата, время «сегодня» в прошлом, оценка не помещается в сутки. */
export function computeTaskScheduleValidationError(
  f: TaskScheduleValidationFields,
  t: TFunction,
): string | null {
  if (f.backlogOnly) return null
  const date = f.scheduledLocalDate
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null

  const todayKey = appLocalDateKey()
  if (date < todayKey) return t('app.createTaskPastDate')

  const clockMin = clockMinutesFromScheduleFields(f)

  if (date === todayKey && clockMin != null) {
    const now = getAppNow()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    if (f.timeMode === 'start' && clockMin < nowMin) return t('app.createTaskPastClockToday')
    if (f.timeMode === 'end' && clockMin < nowMin) return t('app.createTaskPastClockToday')
  }

  const estNorm = normalizeEstimatePair(f.estimatedHours, f.estimatedMinutesPart)
  const estMerge = mergeEstimateParts(estNorm.hours, estNorm.minutes)
  if (estMerge.invalid || estMerge.total == null || estMerge.total <= 0) return null
  if (!f.plannedWithEstimateRequired) return null

  if (f.timeMode === 'start' && clockMin != null) {
    if (clockMin + estMerge.total > MINUTES_PER_DAY) return t('app.createTaskEstimateExceedsDay')
  }
  if (f.timeMode === 'end' && clockMin != null) {
    if (clockMin < estMerge.total) return t('app.createTaskEstimateExceedsDayEnd')
  }

  return null
}

/**
 * Мягкое предупреждение: задача «на день» без времени суток, сегодня,
 * оценка больше оставшегося календарного дня до полуночи.
 * Рабочие часы в настройках — позже; сейчас считаем остаток календарного дня.
 */
export function computeFloatingEstimateDayWarning(
  f: TaskScheduleValidationFields,
  t: TFunction,
): string | null {
  if (f.backlogOnly) return null
  if (f.scheduledLocalDate !== appLocalDateKey()) return null
  if (f.timeMode !== 'none') return null

  const estNorm = normalizeEstimatePair(f.estimatedHours, f.estimatedMinutesPart)
  const estMerge = mergeEstimateParts(estNorm.hours, estNorm.minutes)
  if (estMerge.invalid || estMerge.total == null || estMerge.total <= 0) return null
  if (!f.plannedWithEstimateRequired) return null

  const now = getAppNow()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const remainder = MINUTES_PER_DAY - nowMin
  if (estMerge.total > remainder) return t('app.estimateExceedsRestOfCalendarDay')

  return null
}

/** Якорь повтора не может быть в прошлом (относительно локального «сегодня»). */
export function computeRecurrenceAnchorPastError(
  anchorLocalDate: string | null | undefined,
  hasRecurrence: boolean,
  t: TFunction,
): string | null {
  if (!hasRecurrence) return null
  const a = anchorLocalDate?.trim()
  if (!a || !/^\d{4}-\d{2}-\d{2}$/.test(a)) return null
  if (a < appLocalDateKey()) return t('app.recurrenceAnchorPast')
  return null
}
