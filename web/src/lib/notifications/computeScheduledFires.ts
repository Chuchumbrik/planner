import type { NotificationDeliveryMode, VaultPayload } from '@motivator/core'
import { localDateKey, parseLocalDateKey, shiftLocalDateKey, taskOccursOnDate } from '@motivator/core'

export const NOTIFICATION_SCHEDULE_HORIZON_DAYS = 14

export type NotificationFireKind = 'task_start' | 'task_end' | 'eod_reminder'

const EOD_TASK_ID = '__eod__'

export type FireRowInput = {
  task_id: string
  kind: NotificationFireKind
  fire_at_utc: string
  dedupe_key: string
  title: string | null
  locale: 'ru' | 'en'
}

function fireAtUtcIso(dateKey: string, minutesFromMidnight: number): string | null {
  const base = parseLocalDateKey(dateKey)
  if (!base) return null
  const h = Math.floor(minutesFromMidnight / 60)
  const m = minutesFromMidnight % 60
  base.setHours(h, m, 0, 0)
  return base.toISOString()
}

/**
 * Строки для `notification_fire_requests`: только будущие срабатывания, `title` только в режиме `full`.
 */
export function computeScheduledFireRequests(
  vault: VaultPayload,
  opts: { deliveryMode: NotificationDeliveryMode; locale: 'ru' | 'en'; now?: Date },
): FireRowInput[] {
  if (opts.deliveryMode === 'off') return []

  const now = opts.now ?? new Date()
  const nowMs = now.getTime()
  const todayKey = localDateKey(now)
  const rows: FireRowInput[] = []

  const eodPush = vault.eodPreferences?.pushReminderMinutesFromMidnight
  if (
    vault.eodPreferences?.enabled !== false &&
    typeof eodPush === 'number' &&
    Number.isFinite(eodPush)
  ) {
    const mins = Math.round(eodPush)
    if (mins >= 0 && mins <= 1439) {
      const done = vault.eodCompletedLocalDates ?? []
      if (!done.includes(todayKey)) {
        const fireIso = fireAtUtcIso(todayKey, mins)
        if (fireIso && Date.parse(fireIso) > nowMs) {
          rows.push({
            task_id: EOD_TASK_ID,
            kind: 'eod_reminder',
            fire_at_utc: fireIso,
            dedupe_key: `eod_reminder|${todayKey}|${mins}`,
            title: null,
            locale: opts.locale,
          })
        }
      }
    }
  }

  for (let i = 0; i < NOTIFICATION_SCHEDULE_HORIZON_DAYS; i++) {
    const dayKey = shiftLocalDateKey(todayKey, i)
    for (const task of vault.tasks) {
      if (!taskOccursOnDate(task, dayKey)) continue
      if (task.timeMode !== 'start' && task.timeMode !== 'end') continue

      const mins = task.timeMinutesFromMidnight
      if (mins == null || mins < 0 || mins > 1439) continue

      const kind: NotificationFireKind = task.timeMode === 'start' ? 'task_start' : 'task_end'
      const fireIso = fireAtUtcIso(dayKey, mins)
      if (!fireIso) continue
      if (Date.parse(fireIso) <= nowMs) continue

      const dedupe_key = `${task.id}|${kind}|${dayKey}|${mins}`
      const title =
        opts.deliveryMode === 'full' ? (task.title.trim().slice(0, 500) || null) : null

      rows.push({
        task_id: task.id,
        kind,
        fire_at_utc: fireIso,
        dedupe_key,
        title,
        locale: opts.locale,
      })
    }
  }

  return rows
}
