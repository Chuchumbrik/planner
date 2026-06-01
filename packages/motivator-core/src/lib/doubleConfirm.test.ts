import { describe, expect, it } from 'vitest'
import type { Task } from '../vault/types'
import {
  computeDoubleConfirmDeadlineIso,
  effectiveDoubleConfirmIntervalMin,
} from './doubleConfirm'

const base: Omit<Task, 'id' | 'title'> = {
  done: false,
  createdAt: '',
  updatedAt: '',
  groupId: 'g',
  colorKey: 'zinc',
  checklist: [],
  priorityRank: 3,
  scheduledLocalDate: null,
  estimatedMinutes: null,
  timeMode: 'none',
  timeMinutesFromMidnight: null,
  recurrence: null,
  recurrenceAnchorLocalDate: null,
  completedOccurrenceLocalDates: [],
}

function task(overrides: Partial<Task>): Task {
  return { ...base, id: 't', title: 'T', ...overrides } as Task
}

describe('computeDoubleConfirmDeadlineIso', () => {
  // TS-033
  it('нормальный ввод: +interval +grace', () => {
    expect(computeDoubleConfirmDeadlineIso('2026-06-01T10:00:00.000Z', 10, 30)).toBe(
      '2026-06-01T10:40:00.000Z',
    )
  })

  // TS-034
  it('невалидный ISO → passthrough', () => {
    expect(computeDoubleConfirmDeadlineIso('not-a-date', 10, 30)).toBe('not-a-date')
  })
})

describe('effectiveDoubleConfirmIntervalMin', () => {
  // TS-035
  it('нет поля → default (10)', () => {
    expect(effectiveDoubleConfirmIntervalMin(task({}))).toBe(10)
  })

  // TS-036
  it('значение 0 вне диапазона → default (10)', () => {
    expect(effectiveDoubleConfirmIntervalMin(task({ doubleConfirmIntervalMinutes: 0 }))).toBe(10)
  })
})
