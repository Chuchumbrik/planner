import { describe, expect, it } from 'vitest'
import type { Task } from '../../vault/types'
import {
  countMissedOccurrencesInRange,
  dailyCompletionBuckets,
  recurrenceInstanceScheduledOnDate,
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

describe('recurrenceInstanceScheduledOnDate', () => {
  it('matches daily from anchor', () => {
    const task = { ...base, id: '1', title: 'T' } as Task
    expect(recurrenceInstanceScheduledOnDate(task, '2025-12-31')).toBe(false)
    expect(recurrenceInstanceScheduledOnDate(task, '2026-01-01')).toBe(true)
    expect(recurrenceInstanceScheduledOnDate(task, '2026-01-02')).toBe(true)
  })
})

describe('countMissedOccurrencesInRange', () => {
  it('counts days without completion for daily task', () => {
    const task = { ...base, id: '1', title: 'T' } as Task
    const n = countMissedOccurrencesInRange(task, '2026-01-01', '2026-01-03', '2026-01-10')
    expect(n).toBe(3)
  })

  it('excludes completed days', () => {
    const task = {
      ...base,
      id: '1',
      title: 'T',
      completedOccurrenceLocalDates: ['2026-01-02'],
    } as Task
    const n = countMissedOccurrencesInRange(task, '2026-01-01', '2026-01-03', '2026-01-10')
    expect(n).toBe(2)
  })
})

describe('dailyCompletionBuckets', () => {
  it('aggregates completed occurrence dates', () => {
    const tasks: Task[] = [
      {
        ...base,
        id: '1',
        title: 'A',
        completedOccurrenceLocalDates: ['2026-05-01', '2026-05-02'],
      } as Task,
    ]
    const buckets = dailyCompletionBuckets(tasks, '2026-05-01', '2026-05-02')
    const m = new Map(buckets.map((b) => [b.dateKey, b.count]))
    expect(m.get('2026-05-01')).toBe(1)
    expect(m.get('2026-05-02')).toBe(1)
  })
})
