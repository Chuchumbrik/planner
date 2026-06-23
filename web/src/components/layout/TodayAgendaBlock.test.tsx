import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '@motivator/core'

import { TodayAgendaBlock } from './TodayAgendaBlock'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
    i18n: { language: 'ru' },
  }),
}))

const base: Omit<Task, 'id' | 'title'> = {
  done: false,
  createdAt: '',
  updatedAt: '',
  groupId: 'g',
  colorKey: 'sky',
  checklist: [],
  priorityRank: 3,
  scheduledLocalDate: '2026-06-22',
  estimatedMinutes: null,
  timeMode: 'none',
  timeMinutesFromMidnight: null,
  recurrence: null,
  recurrenceAnchorLocalDate: null,
  completedOccurrenceLocalDates: [],
}
const task = (o: Partial<Task>): Task => ({ ...base, id: 't', title: 'T', ...o })

describe('TodayAgendaBlock', () => {
  it('пустой список → плейсхолдер', () => {
    render(<TodayAgendaBlock tasks={[]} onTaskClick={vi.fn()} />)
    expect(screen.getByText('app.emptyPlannedDay')).toBeInTheDocument()
  })

  it('показывает время задачи в HH:MM', () => {
    render(
      <TodayAgendaBlock
        tasks={[task({ id: 'a', title: 'Звонок', timeMode: 'start', timeMinutesFromMidnight: 9 * 60 + 5 })]}
        onTaskClick={vi.fn()}
      />,
    )
    expect(screen.getByText('09:05')).toBeInTheDocument()
  })

  it('cap=max и «… и ещё N»', () => {
    const tasks = Array.from({ length: 7 }, (_, i) => task({ id: `t${i}`, title: `Задача ${i}` }))
    render(<TodayAgendaBlock tasks={tasks} onTaskClick={vi.fn()} max={5} />)
    expect(screen.getByText('app.backlogMore:2')).toBeInTheDocument()
  })

  it('клик по задаче вызывает onTaskClick с id', () => {
    const onClick = vi.fn()
    render(<TodayAgendaBlock tasks={[task({ id: 'x', title: 'A' })]} onTaskClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onClick).toHaveBeenCalledWith('x')
  })
})
