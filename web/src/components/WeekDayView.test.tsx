import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PriorityLabels } from '@motivator/core'

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

import { WeekDayView } from './WeekDayView'

const labels: PriorityLabels = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }

function baseProps() {
  return {
    day: '2026-06-22',
    tasks: [],
    todayKey: '2026-06-22',
    priorityLabels: labels,
    locale: 'ru-RU',
    canEdit: true,
    onTaskClick: vi.fn(),
    onSlotClick: vi.fn(),
    onPrevDay: vi.fn(),
    onNextDay: vi.fn(),
  }
}

describe('WeekDayView', () => {
  it('кнопки ‹ / › вызывают onPrevDay / onNextDay', () => {
    const props = baseProps()
    render(<WeekDayView {...props} />)
    fireEvent.click(screen.getByRole('button', { name: '‹' }))
    fireEvent.click(screen.getByRole('button', { name: '›' }))
    expect(props.onPrevDay).toHaveBeenCalledTimes(1)
    expect(props.onNextDay).toHaveBeenCalledTimes(1)
  })

  it('свайп влево → следующий день, вправо → предыдущий', () => {
    const props = baseProps()
    const { container } = render(<WeekDayView {...props} />)
    const root = container.firstChild as HTMLElement
    fireEvent.touchStart(root, { touches: [{ clientX: 200 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 120 }] }) // влево 80px
    expect(props.onNextDay).toHaveBeenCalledTimes(1)
    fireEvent.touchStart(root, { touches: [{ clientX: 100 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 200 }] }) // вправо 100px
    expect(props.onPrevDay).toHaveBeenCalledTimes(1)
  })
})
