import { describe, expect, it } from 'vitest'
import type { Task } from '../vault/types'
import {
  recurrenceRuleMatchesDate,
  taskHasOccurrenceOnDate,
  taskOccursOnDate,
} from './recurrence'

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
  recurrence: { kind: 'daily' },
  recurrenceAnchorLocalDate: '2026-01-01',
  completedOccurrenceLocalDates: [],
}

function task(overrides: Partial<Task>): Task {
  return { ...base, id: 't', title: 'T', ...overrides } as Task
}

describe('recurrenceRuleMatchesDate', () => {
  // TS-008 / TS-009
  it('daily: после якоря → true, до якоря → false', () => {
    const t = task({ recurrence: { kind: 'daily' }, recurrenceAnchorLocalDate: '2026-01-10' })
    expect(recurrenceRuleMatchesDate(t, '2026-01-11')).toBe(true)
    expect(recurrenceRuleMatchesDate(t, '2026-01-09')).toBe(false)
  })

  // TS-010 / TS-011
  it('everyNDays: попадание ровно через n дней, промах иначе', () => {
    const t = task({ recurrence: { kind: 'everyNDays', n: 3 }, recurrenceAnchorLocalDate: '2026-01-01' })
    expect(recurrenceRuleMatchesDate(t, '2026-01-04')).toBe(true)
    expect(recurrenceRuleMatchesDate(t, '2026-01-03')).toBe(false)
  })

  // TS-012
  it('weekly: совпадение дня недели', () => {
    // 2026-06-01 — понедельник (getDay() === 1), 2026-06-02 — вторник (2)
    const t = task({ recurrence: { kind: 'weekly', weekdays: [1, 3] }, recurrenceAnchorLocalDate: '2026-01-01' })
    expect(recurrenceRuleMatchesDate(t, '2026-06-01')).toBe(true)
    expect(recurrenceRuleMatchesDate(t, '2026-06-02')).toBe(false)
  })
})

describe('taskHasOccurrenceOnDate', () => {
  // TS-013
  it('повтор с done=true → false (серия архивирована)', () => {
    const t = task({ done: true, recurrence: { kind: 'daily' }, recurrenceAnchorLocalDate: '2026-01-01' })
    expect(taskHasOccurrenceOnDate(t, '2026-01-05')).toBe(false)
  })

  // TS-014
  it('пропущенная дата в skippedOccurrenceLocalDates → false', () => {
    const t = task({
      recurrence: { kind: 'daily' },
      recurrenceAnchorLocalDate: '2026-01-01',
      skippedOccurrenceLocalDates: ['2026-01-05'],
    })
    expect(taskHasOccurrenceOnDate(t, '2026-01-05')).toBe(false)
    expect(taskHasOccurrenceOnDate(t, '2026-01-06')).toBe(true)
  })
})

describe('taskOccursOnDate', () => {
  // TS-015
  it('выполненное вхождение повтора → false (не активно)', () => {
    const t = task({
      recurrence: { kind: 'daily' },
      recurrenceAnchorLocalDate: '2026-01-01',
      completedOccurrenceLocalDates: ['2026-01-05'],
    })
    expect(taskOccursOnDate(t, '2026-01-05')).toBe(false)
    expect(taskOccursOnDate(t, '2026-01-06')).toBe(true)
  })
})
