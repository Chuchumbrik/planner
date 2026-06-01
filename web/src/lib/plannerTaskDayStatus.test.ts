import { describe, expect, it } from 'vitest'
import type { Task } from '@motivator/core'
import { isPlannerTaskOverdue, isTaskTimeSlotPassedOnDay } from './plannerTaskDayStatus'

const base: Omit<Task, 'id' | 'title'> = {
  done: false,
  createdAt: '',
  updatedAt: '',
  groupId: 'g',
  colorKey: 'zinc',
  checklist: [],
  priorityRank: 3,
  scheduledLocalDate: '2026-06-01',
  estimatedMinutes: 60,
  timeMode: 'start',
  timeMinutesFromMidnight: 9 * 60, // 09:00–10:00
  recurrence: null,
  recurrenceAnchorLocalDate: null,
  completedOccurrenceLocalDates: [],
}

function task(overrides: Partial<Task>): Task {
  return { ...base, id: 't', title: 'T', ...overrides } as Task
}

const todayKey = '2026-06-01'

describe('isTaskTimeSlotPassedOnDay', () => {
  // TS-062
  it('другой день → false', () => {
    const now = new Date('2026-06-01T23:00:00')
    expect(isTaskTimeSlotPassedOnDay(task({}), '2026-06-02', todayKey, now)).toBe(false)
  })

  // TS-063
  it('сегодня, слот завершился (now >= slot.end) → true', () => {
    // slot.end = 10:00, now = 11:00
    const now = new Date('2026-06-01T11:00:00')
    expect(isTaskTimeSlotPassedOnDay(task({}), todayKey, todayKey, now)).toBe(true)
  })
})

describe('isPlannerTaskOverdue', () => {
  // TS-064
  it('выполненная задача (done=true) → false', () => {
    const now = new Date('2026-06-01T11:00:00')
    expect(isPlannerTaskOverdue(task({ done: true, scheduledLocalDate: '2026-05-31' }), '2026-05-31', todayKey, now)).toBe(
      false,
    )
  })

  // TS-065
  it('прошлый день, не done → true', () => {
    const now = new Date('2026-06-01T11:00:00')
    expect(isPlannerTaskOverdue(task({ scheduledLocalDate: '2026-05-31' }), '2026-05-31', todayKey, now)).toBe(true)
  })
})
