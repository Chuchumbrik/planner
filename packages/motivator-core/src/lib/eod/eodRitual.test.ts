import { describe, expect, it } from 'vitest'
import {
  backlogTasksForEodReminder,
  partitionEodTasksByCompletion,
  plannedDayCompletionWeights,
  taskActiveOnLocalCalendarDay,
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

  it('counts a task without checklist as one unit', () => {
    const day = '2026-05-09'
    const open = baseTask({ scheduledLocalDate: day, checklist: [] })
    const done = baseTask({ id: 'd', scheduledLocalDate: day, done: true, checklist: [] })
    expect(plannedDayCompletionWeights([open], day)).toEqual({ doneUnits: 0, totalUnits: 1 })
    expect(plannedDayCompletionWeights([done], day)).toEqual({ doneUnits: 1, totalUnits: 1 })
  })

  it('uses checklist items as units when checklist is non-empty', () => {
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
    expect(plannedDayCompletionWeights([t], day)).toEqual({ doneUnits: 2, totalUnits: 4 })
  })

  it('sums multiple tasks', () => {
    const day = '2026-05-09'
    const a = baseTask({
      id: 'a',
      scheduledLocalDate: day,
      checklist: [ck(true, '1'), ck(true, '2')],
    })
    const b = baseTask({
      id: 'b',
      scheduledLocalDate: day,
      done: true,
      checklist: [],
    })
    expect(plannedDayCompletionWeights([a, b], day)).toEqual({ doneUnits: 3, totalUnits: 3 })
  })
})

describe('backlogTasksForEodReminder', () => {
  it('excludes done backlog items', () => {
    const t = baseTask({ id: 'x', scheduledLocalDate: null, done: true })
    expect(backlogTasksForEodReminder([t])).toHaveLength(0)
  })
})
