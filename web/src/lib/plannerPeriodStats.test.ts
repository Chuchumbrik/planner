import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/appNow', () => ({
  getAppNow: () => new Date('2026-06-01T23:00:00'),
}))

import type { Task } from '@motivator/core'
import { countOverdueInDays, summarizePlannerDay } from './plannerPeriodStats'

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
  timeMode: 'none',
  timeMinutesFromMidnight: null,
  recurrence: null,
  recurrenceAnchorLocalDate: null,
  completedOccurrenceLocalDates: [],
}

function task(overrides: Partial<Task>): Task {
  return { ...base, id: 't', title: 'T', ...overrides } as Task
}

const todayKey = '2026-06-01'

describe('summarizePlannerDay', () => {
  // TS-067
  it('смешанный день (сегодня): 1 done, 1 overdue, 1 pending', () => {
    // now = 2026-06-01T23:00:00 → nowMin = 1380
    const tasks = [
      // done: выполнена сегодня (разовая с done)
      task({ id: 'done', done: true, scheduledLocalDate: todayKey }),
      // overdue: слот завершился (08:00–09:00 < 23:00)
      task({ id: 'overdue', scheduledLocalDate: todayKey, timeMode: 'start', timeMinutesFromMidnight: 8 * 60, estimatedMinutes: 60 }),
      // pending: слот ещё впереди (23:30–23:59 > 23:00)
      task({ id: 'pending', scheduledLocalDate: todayKey, timeMode: 'start', timeMinutesFromMidnight: 23 * 60 + 30, estimatedMinutes: 29 }),
    ]
    const summary = summarizePlannerDay(tasks, todayKey, todayKey)
    expect(summary.total).toBe(3)
    expect(summary.done).toBe(1)
    expect(summary.overdue).toBe(1)
  })

  // TS-068
  it('будущий день → overdue=0', () => {
    const tasks = [task({ id: 'a', scheduledLocalDate: '2026-06-05' })]
    const summary = summarizePlannerDay(tasks, '2026-06-05', todayKey)
    expect(summary.overdue).toBe(0)
  })

  it('taskColors: уникальные цвета задач дня (дедуп)', () => {
    const tasks = [
      task({ id: 'a', colorKey: 'red', scheduledLocalDate: todayKey }),
      task({ id: 'b', colorKey: 'red', scheduledLocalDate: todayKey }), // дубль цвета
      task({ id: 'c', colorKey: 'sky', scheduledLocalDate: todayKey }),
    ]
    const summary = summarizePlannerDay(tasks, todayKey, todayKey)
    expect(summary.taskColors).toHaveLength(2)
  })
})

describe('countOverdueInDays', () => {
  // TS-069
  it('будущие дни пропускаются', () => {
    const tasks = [task({ id: 'a', scheduledLocalDate: '2026-06-05' })]
    expect(countOverdueInDays(tasks, ['2026-06-05'], todayKey)).toBe(0)
  })
})
