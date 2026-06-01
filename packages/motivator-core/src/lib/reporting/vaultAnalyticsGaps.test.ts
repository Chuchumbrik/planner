import { describe, expect, it } from 'vitest'
import type { Task } from '../../vault/types'
import {
  aggregateRecurringMisses,
  consecutiveDr013DaysEndingOn,
  dailyCompletionBuckets,
  dr013DaySuccessful,
  isMissedOccurrenceOnDate,
} from './vaultAnalytics'

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

describe('dr013DaySuccessful', () => {
  // TS-037
  it('EOD завершён и задач нет → true', () => {
    const eod = new Set(['2026-06-01'])
    expect(dr013DaySuccessful([], '2026-06-01', eod)).toBe(true)
  })

  // TS-038
  it('EOD завершён, но задачи не выполнены → false', () => {
    const eod = new Set(['2026-06-01'])
    const tasks = [
      task({ id: 'a', completedOccurrenceLocalDates: [] }),
      task({ id: 'b', completedOccurrenceLocalDates: [] }),
    ]
    expect(dr013DaySuccessful(tasks, '2026-06-01', eod)).toBe(false)
  })

  // TS-039
  it('EOD не завершён → false', () => {
    const eod = new Set<string>()
    expect(dr013DaySuccessful([], '2026-06-01', eod)).toBe(false)
  })
})

describe('consecutiveDr013DaysEndingOn', () => {
  // TS-040
  it('3 подряд успешных дня → 3', () => {
    const eod = new Set(['2026-05-30', '2026-05-31', '2026-06-01'])
    expect(consecutiveDr013DaysEndingOn([], '2026-06-01', eod)).toBe(3)
  })

  // TS-041
  it('вчера неуспешный → 0', () => {
    // последний день (2026-06-01) сам не в eod → стрик прерывается сразу
    const eod = new Set(['2026-05-30'])
    expect(consecutiveDr013DaysEndingOn([], '2026-06-01', eod)).toBe(0)
  })
})

describe('isMissedOccurrenceOnDate', () => {
  // TS-042
  it('dateKey >= todayKey → false (сегодня/будущее не пропуск)', () => {
    const t = task({ recurrence: { kind: 'daily' }, recurrenceAnchorLocalDate: '2026-01-01' })
    expect(isMissedOccurrenceOnDate(t, '2026-06-01', '2026-06-01')).toBe(false)
    expect(isMissedOccurrenceOnDate(t, '2026-06-02', '2026-06-01')).toBe(false)
  })
})

describe('aggregateRecurringMisses', () => {
  // TS-043
  it('сортировка по убыванию missedCount', () => {
    const few = task({ id: 'few', title: 'Few', completedOccurrenceLocalDates: ['2026-01-02', '2026-01-03'] })
    const many = task({ id: 'many', title: 'Many', completedOccurrenceLocalDates: [] })
    const rows = aggregateRecurringMisses([few, many], '2026-01-01', '2026-01-03', '2026-01-10')
    expect(rows.map((r) => r.seriesId)).toEqual(['many', 'few'])
    expect(rows[0].missedCount).toBeGreaterThanOrEqual(rows[1].missedCount)
  })
})

describe('dailyCompletionBuckets', () => {
  // TS-044
  it('незакрытая разовая задача (done=false) не попадает в счётчик', () => {
    const tasks = [
      task({ id: 'one', recurrence: null, recurrenceAnchorLocalDate: null, done: false, scheduledLocalDate: '2026-01-01' }),
    ]
    const buckets = dailyCompletionBuckets(tasks, '2026-01-01', '2026-01-01')
    expect(buckets).toEqual([{ dateKey: '2026-01-01', count: 0 }])
  })
})
