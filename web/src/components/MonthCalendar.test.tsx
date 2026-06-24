import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { MonthMatrixCell } from '@motivator/core'

import { MonthCalendar } from './MonthCalendar'
import type { PlannerDaySummary } from '@/lib/plannerPeriodStats'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
    i18n: { language: 'ru' },
  }),
}))

const matrix: MonthMatrixCell[][] = [
  [{ dateKey: '2026-06-10' }, { dateKey: '2026-06-11' }],
]

function dotsInButton(name: string): number {
  const btn = screen.getByRole('button', { name: new RegExp(`^${name}`) })
  return btn.querySelectorAll('span[style*="background"]').length
}

describe('MonthCalendar — точки цветов групп (BR-D-008)', () => {
  it('рисует точку на каждый уникальный цвет задач дня', () => {
    const daySummaries: Record<string, PlannerDaySummary> = {
      '2026-06-10': { total: 2, done: 0, overdue: 0, taskColors: ['#ef4444', '#0ea5e9'] },
      '2026-06-11': { total: 0, done: 0, overdue: 0, taskColors: [] },
    }
    render(
      <MonthCalendar
        matrix={matrix}
        daySummaries={daySummaries}
        todayKey="2026-06-01"
        locale="ru-RU"
        canEdit
        onPickDay={vi.fn()}
      />,
    )
    expect(dotsInButton('10')).toBe(2)
    expect(dotsInButton('11')).toBe(0)
  })
})
