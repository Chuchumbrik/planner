import { describe, expect, it } from 'vitest'
import type { Task } from '@motivator/core'
import { tasksVisibleInPlannerView } from './plannerFilterScope'

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

// 2026-06-02 — вторник (getDay() === 2)
const opts = {
  selectedDay: '2026-06-01',
  weekDays: ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07'],
  monthYear: 2026,
  monthIndex: 5, // июнь
}

describe('tasksVisibleInPlannerView — day', () => {
  // TS-071
  it('бэклог (scheduledLocalDate=null, без повтора) включён в day-view', () => {
    const backlog = task({ id: 'b', scheduledLocalDate: null, recurrence: null })
    const result = tasksVisibleInPlannerView([backlog], 'day', opts)
    expect(result.map((t) => t.id)).toContain('b')
  })
})

describe('tasksVisibleInPlannerView — week', () => {
  // TS-072
  it('weekly задача с вхождением во вторник включена', () => {
    const t = task({
      id: 'w',
      recurrence: { kind: 'weekly', weekdays: [2] },
      recurrenceAnchorLocalDate: '2026-01-01',
    })
    const result = tasksVisibleInPlannerView([t], 'week', opts)
    expect(result.map((x) => x.id)).toContain('w')
  })
})

describe('tasksVisibleInPlannerView — month', () => {
  // TS-073
  it('задача без вхождений в месяце исключена', () => {
    const t = task({ id: 'x', scheduledLocalDate: '2026-07-15', recurrence: null })
    const result = tasksVisibleInPlannerView([t], 'month', opts)
    expect(result.map((x) => x.id)).not.toContain('x')
  })
})
