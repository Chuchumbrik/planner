import { describe, expect, it } from 'vitest'
import type { Task, VaultPayload } from '@motivator/core'
import { emptyVault } from '@motivator/core'
import { computeScheduledFireRequests } from './computeScheduledFires'

function baseVault(overrides: Partial<VaultPayload> = {}): VaultPayload {
  return { ...emptyVault(), ...overrides }
}

function task(overrides: Partial<Task>): Task {
  return {
    id: 't',
    title: 'Задача',
    done: false,
    groupId: 'g1',
    colorKey: 'zinc',
    priorityRank: 3,
    scheduledLocalDate: '2026-05-15',
    estimatedMinutes: 30,
    timeMode: 'start',
    timeMinutesFromMidnight: 12 * 60,
    recurrence: null,
    recurrenceAnchorLocalDate: null,
    completedOccurrenceLocalDates: [],
    checklist: [],
    createdAt: '2026-05-14T10:00:00.000Z',
    updatedAt: '2026-05-14T10:00:00.000Z',
    ...overrides,
  } as Task
}

const now = new Date('2026-05-15T08:00:00')

describe('computeScheduledFireRequests — gaps', () => {
  // TS-112
  it("deliveryMode='off' → []", () => {
    const vault = baseVault({ tasks: [task({})] })
    expect(computeScheduledFireRequests(vault, { deliveryMode: 'off', locale: 'ru', now })).toEqual([])
  })

  // TS-113
  it('EOD напоминание в будущем → row с kind=eod_reminder, task_id=__eod__', () => {
    const vault = baseVault({
      tasks: [],
      eodPreferences: { enabled: true, autoCloseAtDayEnd: false, pushReminderMinutesFromMidnight: 20 * 60 },
      eodCompletedLocalDates: [],
    })
    const rows = computeScheduledFireRequests(vault, { deliveryMode: 'hybrid', locale: 'ru', now })
    const eod = rows.find((r) => r.kind === 'eod_reminder')
    expect(eod).toBeDefined()
    expect(eod?.task_id).toBe('__eod__')
  })

  // TS-114
  it('EOD уже прошёл (fire_at <= now) → eod row не включается', () => {
    const vault = baseVault({
      tasks: [],
      // now = 08:00; reminder at 07:00 уже прошёл
      eodPreferences: { enabled: true, autoCloseAtDayEnd: false, pushReminderMinutesFromMidnight: 7 * 60 },
      eodCompletedLocalDates: [],
    })
    const rows = computeScheduledFireRequests(vault, { deliveryMode: 'hybrid', locale: 'ru', now })
    expect(rows.some((r) => r.kind === 'eod_reminder')).toBe(false)
  })

  // TS-115
  it('EOD уже завершён сегодня → eod row не генерируется', () => {
    const vault = baseVault({
      tasks: [],
      eodPreferences: { enabled: true, autoCloseAtDayEnd: false, pushReminderMinutesFromMidnight: 20 * 60 },
      eodCompletedLocalDates: ['2026-05-15'],
    })
    const rows = computeScheduledFireRequests(vault, { deliveryMode: 'hybrid', locale: 'ru', now })
    expect(rows.some((r) => r.kind === 'eod_reminder')).toBe(false)
  })

  // TS-116 (тип NotificationDeliveryMode не содержит 'minimal'; title раскрывается только при 'full',
  // поэтому проверяем нераскрытие заголовка в режиме 'hybrid').
  it("deliveryMode='hybrid' → title=null (не раскрывается, как и в minimal)", () => {
    const vault = baseVault({
      tasks: [task({ id: 'task-1', title: 'Секретная задача' })],
    })
    const rows = computeScheduledFireRequests(vault, { deliveryMode: 'hybrid', locale: 'ru', now })
    const row = rows.find((r) => r.task_id === 'task-1')
    expect(row).toBeDefined()
    expect(row?.title).toBeNull()
  })

  // TS-117
  it("задача с timeMode='none' → нет fire row", () => {
    const vault = baseVault({
      tasks: [task({ id: 'task-1', timeMode: 'none', timeMinutesFromMidnight: null })],
    })
    const rows = computeScheduledFireRequests(vault, { deliveryMode: 'hybrid', locale: 'ru', now })
    expect(rows.some((r) => r.task_id === 'task-1')).toBe(false)
  })
})
