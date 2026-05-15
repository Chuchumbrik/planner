import { describe, expect, it } from 'vitest'
import type { VaultPayload } from '@motivator/core'
import { emptyVault } from '@motivator/core'

import { computeScheduledFireRequests } from './computeScheduledFires'

function baseVault(overrides: Partial<VaultPayload> = {}): VaultPayload {
  return { ...emptyVault(), ...overrides }
}

describe('computeScheduledFireRequests', () => {
  it('schedules task_start for a recurring task on matching days', () => {
    const vault = baseVault({
      notificationPreferences: { deliveryMode: 'hybrid' },
      tasks: [
        {
          id: 'series-1',
          title: 'Daily standup',
          done: false,
          groupId: 'g1',
          colorKey: 'zinc',
          priorityRank: 3,
          scheduledLocalDate: '2026-05-14',
          estimatedMinutes: 30,
          timeMode: 'start',
          timeMinutesFromMidnight: 9 * 60 + 30,
          recurrence: { kind: 'daily' },
          recurrenceAnchorLocalDate: '2026-05-14',
          completedOccurrenceLocalDates: [],
          checklist: [],
          includeInEodRitual: true,
          createdAt: '2026-05-14T10:00:00.000Z',
          updatedAt: '2026-05-14T10:00:00.000Z',
        },
      ],
    })

    const rows = computeScheduledFireRequests(vault, {
      deliveryMode: 'hybrid',
      locale: 'ru',
      now: new Date('2026-05-15T08:00:00'),
    })

    const todayStart = rows.find(
      (r) => r.task_id === 'series-1' && r.kind === 'task_start' && r.dedupe_key.includes('2026-05-15'),
    )
    expect(todayStart).toBeDefined()
    expect(todayStart?.fire_at_utc).toBeTruthy()
  })

  it('skips recurring occurrence already completed for the day', () => {
    const vault = baseVault({
      notificationPreferences: { deliveryMode: 'hybrid' },
      tasks: [
        {
          id: 'series-1',
          title: 'Daily standup',
          done: false,
          groupId: 'g1',
          colorKey: 'zinc',
          priorityRank: 3,
          scheduledLocalDate: '2026-05-14',
          estimatedMinutes: 30,
          timeMode: 'start',
          timeMinutesFromMidnight: 9 * 60 + 30,
          recurrence: { kind: 'daily' },
          recurrenceAnchorLocalDate: '2026-05-14',
          completedOccurrenceLocalDates: ['2026-05-15'],
          checklist: [],
          includeInEodRitual: true,
          createdAt: '2026-05-14T10:00:00.000Z',
          updatedAt: '2026-05-14T10:00:00.000Z',
        },
      ],
    })

    const rows = computeScheduledFireRequests(vault, {
      deliveryMode: 'hybrid',
      locale: 'ru',
      now: new Date('2026-05-15T08:00:00'),
    })

    expect(rows.some((r) => r.task_id === 'series-1' && r.dedupe_key.includes('2026-05-15'))).toBe(
      false,
    )
  })
})
