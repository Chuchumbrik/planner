import { describe, expect, it } from 'vitest'
import type { Task } from '../vault/types'
import { getTaskSlotMinutes, overlapRangeMinutes, overlapTasksMinutes } from './timeblocking'

const base: Omit<Task, 'id' | 'title'> = {
  done: false,
  createdAt: '',
  updatedAt: '',
  groupId: 'g',
  colorKey: 'zinc',
  checklist: [],
  priorityRank: 3,
  scheduledLocalDate: '2026-06-01',
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

describe('getTaskSlotMinutes', () => {
  // TS-016
  it('timeMode=start: {start, end} = time .. time+estimate', () => {
    const t = task({ timeMode: 'start', timeMinutesFromMidnight: 540, estimatedMinutes: 60 })
    expect(getTaskSlotMinutes(t, '2026-06-01')).toEqual({ start: 540, end: 600 })
  })

  // TS-017
  it('timeMode=end с estimate > time: start не уходит в отрицательные', () => {
    const t = task({ timeMode: 'end', timeMinutesFromMidnight: 30, estimatedMinutes: 90 })
    expect(getTaskSlotMinutes(t, '2026-06-01')).toEqual({ start: 0, end: 30 })
  })

  // TS-018
  it('timeMode=none → null', () => {
    const t = task({ timeMode: 'none' })
    expect(getTaskSlotMinutes(t, '2026-06-01')).toBeNull()
  })
})

describe('overlapRangeMinutes', () => {
  // TS-019
  it('смежные интервалы → 0', () => {
    expect(overlapRangeMinutes({ start: 0, end: 30 }, { start: 30, end: 60 })).toBe(0)
  })

  // TS-020
  it('полное внутреннее вхождение → длина внутреннего интервала', () => {
    expect(overlapRangeMinutes({ start: 0, end: 60 }, { start: 20, end: 40 })).toBe(20)
  })
})

describe('overlapTasksMinutes', () => {
  // TS-021
  it('выполненная разовая задача (done=true) → 0', () => {
    const a = task({ id: 'a', done: true, timeMode: 'start', timeMinutesFromMidnight: 540, estimatedMinutes: 60 })
    const b = task({ id: 'b', timeMode: 'start', timeMinutesFromMidnight: 540, estimatedMinutes: 60 })
    expect(overlapTasksMinutes(a, b, '2026-06-01')).toBe(0)
  })
})
