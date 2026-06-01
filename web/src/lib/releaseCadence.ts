/**
 * Логика напоминания о ритме релизов (Phase 7.7). Чистая, без React.
 *
 * Данные релизов — дневной гранулярности (`dateLabel` `YYYY-MM-DD`), поэтому считаем в днях:
 * порог в часах (24/48/72) переводится в дни (1/2/3). «>72ч без релиза» → красный, иначе янтарный.
 */

import { daysAgo } from './relativeTime'

export type ReminderSeverity = 'none' | 'amber' | 'red'
export type ReminderReason = 'paused' | 'fresh' | 'snoozed' | 'weekend' | 'overdue'

export type ReminderConfig = {
  /** Порог в часах: 24 / 48 / 72. */
  thresholdHours: number
  /** Пропускать выходные. */
  respectWeekends: boolean
  /** `YYYY-MM-DD` до какого дня включительно скрыто (snooze), либо null. */
  snoozedUntil: string | null
  /** Текущая фаза приостановлена — баннер не показываем. */
  paused: boolean
}

export type ReminderResult = {
  severity: ReminderSeverity
  daysSince: number
  reason: ReminderReason
}

export const REMINDER_THRESHOLD_OPTIONS = [24, 48, 72] as const

/** Суббота/воскресенье по UTC-дате. */
export function isWeekend(now: Date): boolean {
  const d = now.getUTCDay()
  return d === 0 || d === 6
}

/** `YYYY-MM-DD` для текущей UTC-даты. */
export function todayIso(now: Date): string {
  return now.toISOString().slice(0, 10)
}

function thresholdDays(hours: number): number {
  return Math.max(1, Math.ceil(hours / 24))
}

/**
 * Решение о баннере: учитывает paused → fresh → snooze → weekend → просрочку.
 * Порядок важен: paused и «свежий» гасят баннер раньше прочих проверок.
 */
export function decideReminder(
  lastReleaseISO: string,
  now: Date,
  cfg: ReminderConfig,
): ReminderResult {
  const daysSince = daysAgo(lastReleaseISO, now)

  if (cfg.paused) return { severity: 'none', daysSince, reason: 'paused' }
  if (daysSince <= thresholdDays(cfg.thresholdHours)) {
    return { severity: 'none', daysSince, reason: 'fresh' }
  }
  if (cfg.snoozedUntil && todayIso(now) <= cfg.snoozedUntil) {
    return { severity: 'none', daysSince, reason: 'snoozed' }
  }
  if (cfg.respectWeekends && isWeekend(now)) {
    return { severity: 'none', daysSince, reason: 'weekend' }
  }
  return { severity: daysSince >= 3 ? 'red' : 'amber', daysSince, reason: 'overdue' }
}
