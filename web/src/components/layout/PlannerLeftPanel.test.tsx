import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import type { TaskGroup } from '@motivator/core'

import { PlannerLeftPanel } from './PlannerLeftPanel'
import { PlannerFilterProvider } from '@/context/PlannerFilterContext'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
    i18n: { language: 'ru' },
  }),
}))

const groups: TaskGroup[] = [{ id: 'g1', name: 'Работа', sortOrder: 0, colorKey: 'sky' }]

function baseProps() {
  return {
    groups,
    year: 2026,
    monthIndex: 5,
    selectedDay: '2026-06-22',
    todayKey: '2026-06-22',
    locale: 'ru-RU',
    onPickDay: vi.fn(),
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    todayTasks: [],
    onTaskClick: vi.fn(),
  }
}

function renderPanel(node: ReactElement) {
  return render(<PlannerFilterProvider>{node}</PlannerFilterProvider>)
}

describe('PlannerLeftPanel', () => {
  it('inline: рендерит мини-календарь, Categories и агенду', () => {
    renderPanel(<PlannerLeftPanel {...baseProps()} variant="inline" />)
    expect(screen.getByRole('button', { name: 'Работа' })).toBeInTheDocument() // Categories
    expect(screen.getByRole('button', { name: '22' })).toBeInTheDocument() // мини-календарь
    expect(screen.getByText('app.today')).toBeInTheDocument() // агенда
  })

  it('drawer закрыт → ничего не рендерит', () => {
    const { container } = renderPanel(
      <PlannerLeftPanel {...baseProps()} variant="drawer" isOpen={false} />,
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('drawer открыт: клик по backdrop вызывает onClose', () => {
    const onClose = vi.fn()
    renderPanel(<PlannerLeftPanel {...baseProps()} variant="drawer" isOpen onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('drawer: выбор дня вызывает onPickDay и закрывает панель', () => {
    const props = baseProps()
    const onClose = vi.fn()
    renderPanel(<PlannerLeftPanel {...props} variant="drawer" isOpen onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(props.onPickDay).toHaveBeenCalledWith('2026-06-15')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
