import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PriorityLabels, Task } from '@motivator/core'

vi.mock('@/lib/appNow', () => ({
  getAppNow: () => new Date('2026-06-22T12:00:00'),
  appLocalDateKey: () => '2026-06-22',
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
    i18n: { language: 'ru' },
  }),
}))

import { WeekGrid } from './WeekGrid'

const base: Omit<Task, 'id' | 'title'> = {
  done: false,
  createdAt: '',
  updatedAt: '',
  groupId: 'g',
  colorKey: 'sky',
  checklist: [],
  priorityRank: 3,
  scheduledLocalDate: '2026-06-22',
  estimatedMinutes: 60,
  timeMode: 'none',
  timeMinutesFromMidnight: null,
  recurrence: null,
  recurrenceAnchorLocalDate: null,
  completedOccurrenceLocalDates: [],
}
const task = (o: Partial<Task>): Task => ({ ...base, id: 't', title: 'T', ...o })
const labels: PriorityLabels = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }

function renderGrid(tasks: Task[], extra?: { onSlotClick?: (d: string, m: number) => void }) {
  return render(
    <WeekGrid
      weekDays={['2026-06-22']}
      tasks={tasks}
      todayKey="2026-06-22"
      priorityLabels={labels}
      locale="ru-RU"
      canEdit
      onTaskClick={vi.fn()}
      onSlotClick={extra?.onSlotClick}
    />,
  )
}

describe('WeekGrid — мягкая сетка (BR-D-007 D)', () => {
  it('задача в ночные часы схлопнута, бар показывает счётчик; клик раскрывает', () => {
    // слот 02:00–03:00 → попадает в схлоп 0:00–7:00
    renderGrid([task({ id: 'n', title: 'Ночь', timeMode: 'start', timeMinutesFromMidnight: 2 * 60 })])
    // верхний и нижний бары оба показывают ярлык; счётчик «+1» уникален для верхнего
    expect(screen.getAllByText('app.weekNightShow')).toHaveLength(2)
    fireEvent.click(screen.getByText('+1')) // клик по верхнему бару (раскрыть ночь)
    expect(screen.getByText('app.weekNightHide')).toBeInTheDocument()
  })

  it('дорожка «без времени»: cap + «… и ещё N»', () => {
    const tasks = Array.from({ length: 6 }, (_, i) => task({ id: `u${i}`, title: `U${i}` }))
    renderGrid(tasks)
    expect(screen.getByText('app.backlogMore:2')).toBeInTheDocument()
  })

  it('клик по пустому слоту вызывает onSlotClick с днём и минутами', () => {
    const onSlotClick = vi.fn()
    renderGrid([], { onSlotClick })
    const addButtons = screen.getAllByRole('button', { name: /app\.weekSlotAdd/ })
    expect(addButtons.length).toBeGreaterThan(0)
    fireEvent.click(addButtons[0])
    expect(onSlotClick).toHaveBeenCalledWith('2026-06-22', 7 * 60) // первый рабочий час
  })
})
