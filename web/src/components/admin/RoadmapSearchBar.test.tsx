import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RoadmapSearchBar } from './RoadmapSearchBar'
import { EMPTY_FILTER } from '@/lib/roadmapFilter'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

function baseProps() {
  return {
    filter: EMPTY_FILTER,
    versions: ['0.7.15', '0.7.0'],
    matched: 5,
    total: 10,
    onQueryChange: vi.fn(),
    onToggleTag: vi.fn(),
    onSetFrom: vi.fn(),
    onSetTo: vi.fn(),
    onReset: vi.fn(),
  }
}

afterEach(() => vi.useRealTimers())

describe('RoadmapSearchBar', () => {
  it('поиск пишет в onQueryChange после debounce 250ms', () => {
    vi.useFakeTimers()
    const p = baseProps()
    render(<RoadmapSearchBar {...p} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'push' } })
    expect(p.onQueryChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(250))
    expect(p.onQueryChange).toHaveBeenCalledWith('push')
  })

  it('клик по тег-чипу зовёт onToggleTag', () => {
    const p = baseProps()
    render(<RoadmapSearchBar {...p} />)
    fireEvent.click(screen.getByRole('button', { name: /^feat$/i }))
    expect(p.onToggleTag).toHaveBeenCalledWith('feat')
  })

  it('range-селекты зовут onSetFrom/onSetTo', () => {
    const p = baseProps()
    render(<RoadmapSearchBar {...p} />)
    fireEvent.change(screen.getByLabelText('settings.roadmapSearchFrom'), { target: { value: '0.7.0' } })
    expect(p.onSetFrom).toHaveBeenCalledWith('0.7.0')
    fireEvent.change(screen.getByLabelText('settings.roadmapSearchTo'), { target: { value: '0.7.15' } })
    expect(p.onSetTo).toHaveBeenCalledWith('0.7.15')
  })

  it('Reset виден только при активном фильтре и зовёт onReset', () => {
    const p = baseProps()
    const { rerender } = render(<RoadmapSearchBar {...p} />)
    expect(screen.queryByText('settings.roadmapSearchReset')).not.toBeInTheDocument()
    rerender(<RoadmapSearchBar {...p} filter={{ ...EMPTY_FILTER, tags: ['fix'] }} />)
    fireEvent.click(screen.getByText('settings.roadmapSearchReset'))
    expect(p.onReset).toHaveBeenCalledOnce()
  })
})
