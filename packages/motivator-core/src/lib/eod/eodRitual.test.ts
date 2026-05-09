import { describe, expect, it } from 'vitest'
import {
  backlogTasksForEodReminder,
  partitionEodTasksByCompletion,
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

describe('backlogTasksForEodReminder', () => {
  it('excludes done backlog items', () => {
    const t = baseTask({ id: 'x', scheduledLocalDate: null, done: true })
    expect(backlogTasksForEodReminder([t])).toHaveLength(0)
  })
})
