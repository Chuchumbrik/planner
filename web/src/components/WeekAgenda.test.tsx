import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '@motivator/core'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'ru' } }),
}))

import { WeekAgenda } from './WeekAgenda'

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

describe('WeekAgenda', () => {
  it('задача дня показана; время в HH:MM; клик → onTaskClick(id, day)', () => {
    const onTaskClick = vi.fn()
    render(
      <WeekAgenda
        weekDays={['2026-06-22', '2026-06-23']}
        tasks={[
          task({ id: 'a', title: 'Звонок', scheduledLocalDate: '2026-06-22', timeMode: 'start', timeMinutesFromMidnight: 9 * 60 }),
        ]}
        todayKey="2026-06-22"
        locale="ru-RU"
        canEdit
        onTaskClick={onTaskClick}
      />,
    )
    expect(screen.getByRole('button', { name: /Звонок/ })).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Звонок/ }))
    expect(onTaskClick).toHaveBeenCalledWith('a', '2026-06-22')
  })

  it('пустой день показывает плейсхолдер', () => {
    render(
      <WeekAgenda
        weekDays={['2026-06-25']}
        tasks={[]}
        todayKey="2026-06-22"
        locale="ru-RU"
        canEdit
        onTaskClick={vi.fn()}
      />,
    )
    expect(screen.getAllByText('app.emptyPlannedDay').length).toBeGreaterThan(0)
  })
})
