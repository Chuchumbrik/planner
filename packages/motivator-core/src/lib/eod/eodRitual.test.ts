import { describe, expect, it } from 'vitest'
import {
  backlogTasksForEodReminder,
  isPlannedTaskFullyCompleteForDay,
  partitionEodTasksByCompletion,
  plannedDayCompletionWeights,
  plannedPeriodProgress,
  taskActiveOnLocalCalendarDay,
  tasksScheduledForPlannerDay,
} from './eodRitual'
import type { Task } from '../../vault/types'
import { DEFAULT_GROUP_ID } from '../../vault/types'

function baseTask(overrides: Partial<Task>): Task {
  const now = '2026-05-09T12:00:00.000Z'
  return {
    id: 't1',
    title: 'Test',
    done: false,
    createdAt: now,
    updatedAt: now,
    groupId: DEFAULT_GROUP_ID,
    colorKey: 'zinc',
    priorityRank: 3,
    checklist: [],
    scheduledLocalDate: null,
    estimatedMinutes: null,
    timeMode: 'none',
    timeMinutesFromMidnight: null,
    recurrence: null,
    recurrenceAnchorLocalDate: null,
    completedOccurrenceLocalDates: [],
    includeInEodRitual: true,
    ...overrides,
  } as Task
}

describe('partitionEodTasksByCompletion', () => {
  it('does not treat updated-today backlog as remaining for the day', () => {
    const day = '2026-05-09'
    const staleInUi = baseTask({
      id: 'ghost',
      title: 'Only touched today',
      scheduledLocalDate: null,
      updatedAt: '2026-05-09T18:00:00.000Z',
      createdAt: '2026-01-01T10:00:00.000Z',
    })
    expect(taskActiveOnLocalCalendarDay(staleInUi, day)).toBe(true)

    const { remaining, backlogReminder } = partitionEodTasksByCompletion([staleInUi], day)
    expect(remaining).toHaveLength(0)
    expect(backlogReminder.map((t) => t.id)).toContain('ghost')
  })

  it('splits planned-for-day into completed vs remaining', () => {
    const day = '2026-05-09'
    const done = baseTask({
      id: 'a',
      scheduledLocalDate: day,
      done: true,
    })
    const open = baseTask({
      id: 'b',
      scheduledLocalDate: day,
      done: false,
    })
    const { completed, remaining } = partitionEodTasksByCompletion([done, open], day)
    expect(completed.map((t) => t.id)).toEqual(['a'])
    expect(remaining.map((t) => t.id)).toEqual(['b'])
  })
})

describe('plannedDayCompletionWeights', () => {
  const iso = '2026-05-09T12:00:00.000Z'
  const ck = (done: boolean, id: string) => ({
    id,
    title: id,
    done,
    createdAt: iso,
    updatedAt: iso,
  })

  it('counts each planned task as one slot in the denominator', () => {
    const day = '2026-05-09'
    const open = baseTask({ scheduledLocalDate: day, checklist: [] })
    const done = baseTask({ id: 'd', scheduledLocalDate: day, done: true, checklist: [] })
    expect(plannedDayCompletionWeights([open], day)).toEqual({
      doneFraction: 0,
      plannedTaskCount: 1,
    })
    expect(plannedDayCompletionWeights([done], day)).toEqual({
      doneFraction: 1,
      plannedTaskCount: 1,
    })
  })

  it('treats checklist as fractions of one task', () => {
    const day = '2026-05-09'
    const t = baseTask({
      scheduledLocalDate: day,
      checklist: [
        ck(true, 'a'),
        ck(false, 'b'),
        ck(true, 'c'),
        ck(false, 'd'),
      ],
    })
    expect(plannedDayCompletionWeights([t], day)).toEqual({
      doneFraction: 0.5,
      plannedTaskCount: 1,
    })
  })

  it('caps checklist-only completion below 1 until main checkbox for the day', () => {
    const day = '2026-05-09'
    const t = baseTask({
      scheduledLocalDate: day,
      done: false,
      checklist: [ck(true, 'a'), ck(true, 'b')],
    })
    expect(plannedDayCompletionWeights([t], day)).toEqual({
      doneFraction: 0.99,
      plannedTaskCount: 1,
    })
  })

  it('sums fractional contributions across tasks', () => {
    const day = '2026-05-09'
    const a = baseTask({
      id: 'a',
      scheduledLocalDate: day,
      checklist: [
        ck(true, '1'),
        ck(false, '2'),
        ck(false, '3'),
        ck(false, '4'),
      ],
    })
    const b = baseTask({
      id: 'b',
      scheduledLocalDate: day,
      done: true,
      checklist: [],
    })
    const r = plannedDayCompletionWeights([a, b], day)
    expect(r.plannedTaskCount).toBe(2)
    expect(r.doneFraction).toBeCloseTo(1.25)
  })
})

describe('isPlannedTaskFullyCompleteForDay', () => {
  const day = '2026-05-09'
  const iso = '2026-05-09T12:00:00.000Z'
  const ck = (done: boolean, id: string) => ({
    id,
    title: id,
    done,
    createdAt: iso,
    updatedAt: iso,
  })

  it('true when one-off done for that day', () => {
    const t = baseTask({ scheduledLocalDate: day, done: true })
    expect(isPlannedTaskFullyCompleteForDay(t, day)).toBe(true)
  })

  it('false when checklist fully checked but one-off not marked done', () => {
    const t = baseTask({
      scheduledLocalDate: day,
      done: false,
      checklist: [ck(true, 'a'), ck(true, 'b')],
    })
    expect(isPlannedTaskFullyCompleteForDay(t, day)).toBe(false)
  })

  it('true when checklist fully checked and one-off marked done', () => {
    const t = baseTask({
      scheduledLocalDate: day,
      done: true,
      checklist: [ck(true, 'a'), ck(true, 'b')],
    })
    expect(isPlannedTaskFullyCompleteForDay(t, day)).toBe(true)
  })

  it('false when checklist incomplete', () => {
    const t = baseTask({
      scheduledLocalDate: day,
      done: true,
      checklist: [ck(true, 'a'), ck(false, 'b')],
    })
    expect(isPlannedTaskFullyCompleteForDay(t, day)).toBe(false)
  })
})

describe('tasksScheduledForPlannerDay', () => {
  it('includes one-off scheduled on that day', () => {
    const day = '2026-05-09'
    const t = baseTask({ scheduledLocalDate: day })
    expect(tasksScheduledForPlannerDay([t], day).map((x) => x.id)).toEqual(['t1'])
    expect(tasksScheduledForPlannerDay([t], '2026-05-10')).toHaveLength(0)
  })

  it('excludes backlog without recurrence', () => {
    const t = baseTask({ scheduledLocalDate: null })
    expect(tasksScheduledForPlannerDay([t], '2026-05-09')).toHaveLength(0)
  })
})

describe('plannedPeriodProgress', () => {
  const iso = '2026-05-09T12:00:00.000Z'
  const ck = (done: boolean, id: string) => ({
    id,
    title: id,
    done,
    createdAt: iso,
    updatedAt: iso,
  })

  it('sums planned task-days for each day until today; skips future days', () => {
    const today = '2026-05-14'
    const period = ['2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15']
    const t12 = baseTask({ id: 'd12', scheduledLocalDate: '2026-05-12', checklist: [] })
    const t13 = baseTask({
      id: 'd13',
      scheduledLocalDate: '2026-05-13',
      checklist: [ck(true, '1'), ck(false, '2')],
    })
    const t14 = baseTask({ id: 'd14', scheduledLocalDate: '2026-05-14', done: true, checklist: [] })
    const t15 = baseTask({ id: 'd15', scheduledLocalDate: '2026-05-15', checklist: [] })
    const r = plannedPeriodProgress([t12, t13, t14, t15], period, today)
    expect(r.plannedTaskCount).toBe(3)
    expect(r.doneFraction).toBeCloseTo(1.5)
  })

  it('counts a one-off only on the day it is scheduled', () => {
    const today = '2026-05-10'
    const period = ['2026-05-09', '2026-05-10']
    const a = baseTask({ scheduledLocalDate: '2026-05-09', checklist: [] })
    const r = plannedPeriodProgress([a], period, today)
    expect(r.plannedTaskCount).toBe(1)
    expect(r.doneFraction).toBe(0)
  })
})

describe('backlogTasksForEodReminder', () => {
  it('excludes done backlog items', () => {
    const t = baseTask({ id: 'x', scheduledLocalDate: null, done: true })
    expect(backlogTasksForEodReminder([t])).toHaveLength(0)
  })
})
