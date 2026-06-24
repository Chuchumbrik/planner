import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PlannerLeftPanelMiniCal } from './PlannerLeftPanelMiniCal'

function baseProps() {
  return {
    year: 2026,
    monthIndex: 5, // июнь
    selectedDay: '2026-06-22',
    todayKey: '2026-06-22',
    locale: 'ru-RU',
    onPickDay: vi.fn(),
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
  }
}

describe('PlannerLeftPanelMiniCal', () => {
  it('рендерит дни месяца; выбранный день помечен aria-pressed', () => {
    render(<PlannerLeftPanelMiniCal {...baseProps()} />)
    const d22 = screen.getByRole('button', { name: '22' })
    expect(d22).toHaveAttribute('aria-pressed', 'true')
    expect(d22).toHaveAttribute('aria-current', 'date')
  })

  it('клик по дню вызывает onPickDay с YYYY-MM-DD', () => {
    const props = baseProps()
    render(<PlannerLeftPanelMiniCal {...props} />)
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(props.onPickDay).toHaveBeenCalledWith('2026-06-15')
  })

  it('навигация по месяцам', () => {
    const props = baseProps()
    render(<PlannerLeftPanelMiniCal {...props} />)
    fireEvent.click(screen.getByRole('button', { name: '‹' }))
    fireEvent.click(screen.getByRole('button', { name: '›' }))
    expect(props.onPrevMonth).toHaveBeenCalledTimes(1)
    expect(props.onNextMonth).toHaveBeenCalledTimes(1)
  })
})
