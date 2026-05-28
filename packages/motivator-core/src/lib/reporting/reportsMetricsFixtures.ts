import type { Task } from '../../vault/types'

/** Минимальный шаблон задачи для фикстур отчётов. */
const taskBase: Omit<Task, 'id' | 'title'> = {
  done: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  groupId: 'g1',
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

export function mkTask(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return { ...taskBase, ...partial }
}

/** «Сегодня» для сценариев: 2026-05-28 (четверг). */
export const FIXTURE_TODAY_KEY = '2026-05-28'

export const FIXTURE_TODAY = new Date(2026, 4, 28, 12, 0, 0, 0)

/** EOD-даты для DR-013 стрика. */
export const FIXTURE_EOD: string[] = [
  '2026-05-26',
  '2026-05-27',
  '2026-05-28',
]

/**
 * Нетривиальный смешанный vault:
 * - daily повтор: пропуски 25–27, отметка 27
 * - weekly (пн+ср+пт): пропуски в окне
 * - разовая просроченная 2026-05-23 (внутри 7d-окна при T=28.05)
 * - разовая выполненная 2026-05-22
 * - отметка вне окна графика (2026-05-10) — не должна входить в KPI окна
 * - архивная серия (done) — не в «провалах»
 */
export const FIXTURE_MIXED_TASKS: Task[] = [
  mkTask({
    id: 'rec-daily',
    title: 'Daily habit',
    recurrence: { kind: 'daily' },
    recurrenceAnchorLocalDate: '2026-05-01',
    completedOccurrenceLocalDates: ['2026-05-27', '2026-05-28'],
  }),
  mkTask({
    id: 'rec-weekly',
    title: 'Weekly Mon/Wed/Fri',
    recurrence: { kind: 'weekly', weekdays: [1, 3, 5] },
    recurrenceAnchorLocalDate: '2026-05-01',
    completedOccurrenceLocalDates: [],
  }),
  mkTask({
    id: 'one-off-miss',
    title: 'One-off overdue',
    scheduledLocalDate: '2026-05-23',
  }),
  mkTask({
    id: 'one-off-done',
    title: 'One-off done',
    scheduledLocalDate: '2026-05-22',
    done: true,
  }),
  mkTask({
    id: 'orphan-mark',
    title: 'Mark outside window',
    recurrence: { kind: 'daily' },
    recurrenceAnchorLocalDate: '2026-05-01',
    completedOccurrenceLocalDates: ['2026-05-10'],
  }),
  mkTask({
    id: 'archived-series',
    title: 'Archived series',
    done: true,
    recurrence: { kind: 'daily' },
    recurrenceAnchorLocalDate: '2026-05-01',
  }),
]

/** DR-013: EOD на 26–28, план пустой 26–27, на 28 одна daily выполнена. */
export const FIXTURE_DR013_TASKS: Task[] = [
  mkTask({
    id: 'd1',
    title: 'Only Thu plan',
    recurrence: { kind: 'daily' },
    recurrenceAnchorLocalDate: '2026-05-01',
    completedOccurrenceLocalDates: ['2026-05-26', '2026-05-27', '2026-05-28'],
  }),
]

/** День с планом, EOD есть, ни одной отметки — стрик обрывается. */
export const FIXTURE_DR013_FAIL_DAY_TASKS: Task[] = [
  mkTask({
    id: 'planned-not-done',
    title: 'Planned not done',
    recurrence: { kind: 'daily' },
    recurrenceAnchorLocalDate: '2026-05-01',
    completedOccurrenceLocalDates: ['2026-05-26', '2026-05-27'],
  }),
]
