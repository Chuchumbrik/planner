import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoadmapTimeline } from './RoadmapTimeline'
import { RELEASE_NOTES_BLOCKS } from '@/data/productRoadmap'
import { groupReleasesByDay, type RoadmapDayGroup } from '@/lib/roadmapTimeline'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

const ALL_GROUPS = groupReleasesByDay(RELEASE_NOTES_BLOCKS)

/** Синтетические группы для perf-теста: `days` дней по `perDay` выпусков. */
function makeGroups(days: number, perDay: number): RoadmapDayGroup[] {
  return Array.from({ length: days }, (_, di) => {
    const dateISO = `2026-05-${String(days - di).padStart(2, '0')}`
    return {
      dateISO,
      dateLabel: { ru: dateISO, en: dateISO },
      items: Array.from({ length: perDay }, (_, ii) => {
        const version = `0.${days - di}.${ii}`
        return {
          releasedInVersion: { ru: version, en: version },
          tag: 'feat' as const,
          changes: [{ ru: `изменение ${version}`, en: `change ${version}` }],
        }
      }),
    }
  })
}

describe('RoadmapTimeline', () => {
  it('рендерит заголовок и карточки версий с anchor-id', () => {
    const { container } = render(<RoadmapTimeline groups={ALL_GROUPS} />)
    expect(screen.getByText('settings.roadmapTimelineTitle')).toBeInTheDocument()
    expect(container.querySelector('[id^="v0."]')).toBeTruthy()
  })

  it('«Показать ещё» раскрывает скрытые релизы', async () => {
    render(<RoadmapTimeline groups={ALL_GROUPS} />)
    const more = screen.getByRole('button', { name: /roadmapTimelineShowMore/ })
    expect(more).toBeInTheDocument()
    await userEvent.click(more)
    expect(screen.getByRole('button', { name: /roadmapTimelineShowLess/ })).toBeInTheDocument()
  })

  it('кнопка anchor копирует и показывает «Скопировано»', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<RoadmapTimeline groups={ALL_GROUPS} />)
    const copyButtons = screen.getAllByRole('button', { name: 'settings.roadmapTimelineCopyAnchor' })
    await userEvent.click(copyButtons[0])
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^#v\d+\.\d+\.\d+/))
    expect(screen.getByText('settings.roadmapTimelineCopied')).toBeInTheDocument()
  })

  it('filterActive: «Показать ещё» скрыта, лента раскрыта', () => {
    render(<RoadmapTimeline groups={ALL_GROUPS} filterActive />)
    expect(screen.queryByRole('button', { name: /roadmapTimelineShowMore/ })).not.toBeInTheDocument()
  })

  it('пустые группы → empty-state', () => {
    render(<RoadmapTimeline groups={[]} filterActive />)
    expect(screen.getByText('settings.roadmapSearchEmpty')).toBeInTheDocument()
  })
})

describe('RoadmapTimeline — a11y / keyboard (Phase 7.12)', () => {
  it('лента имеет role="list" и элементы дней role="listitem"', () => {
    const { container } = render(<RoadmapTimeline groups={ALL_GROUPS} />)
    const list = container.querySelector('ol[role="list"]')
    expect(list).toBeTruthy()
    expect(list!.querySelectorAll('li[role="listitem"]').length).toBeGreaterThan(0)
  })

  it('карточки релизов фокусируемы (tabIndex + data-release-card)', () => {
    const { container } = render(<RoadmapTimeline groups={ALL_GROUPS} filterActive />)
    const cards = container.querySelectorAll<HTMLElement>('[data-release-card]')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards[0].getAttribute('tabindex')).toBe('0')
  })

  it('ArrowDown переносит фокус на следующую карточку', () => {
    const { container } = render(<RoadmapTimeline groups={makeGroups(3, 1)} filterActive />)
    const cards = container.querySelectorAll<HTMLElement>('[data-release-card]')
    expect(cards.length).toBe(3)
    cards[0].focus()
    fireEvent.keyDown(cards[0], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cards[1])
    fireEvent.keyDown(cards[1], { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cards[0])
  })

  it('Enter на карточке копирует anchor', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { container } = render(<RoadmapTimeline groups={makeGroups(1, 1)} filterActive />)
    const card = container.querySelector<HTMLElement>('[data-release-card]')!
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^#v\d+\.\d+\.\d+/))
  })
})

describe('RoadmapTimeline — perf / виртуализация (Phase 7.12)', () => {
  it('при >50 выпусках без фильтра скрытые карточки не в DOM', () => {
    // 10 дней × 6 выпусков = 60 выпусков; видимый лимит — 5.
    const { container } = render(<RoadmapTimeline groups={makeGroups(10, 6)} />)
    const rendered = container.querySelectorAll('[data-release-card]').length
    // Первый день (6 выпусков) уже превышает лимит 5 → видим только его, остальные скрыты.
    expect(rendered).toBeLessThanOrEqual(6)
    expect(rendered).toBeLessThan(60)
  })

  it('«Показать ещё» рендерит все скрытые карточки', async () => {
    const { container } = render(<RoadmapTimeline groups={makeGroups(10, 6)} />)
    await userEvent.click(screen.getByRole('button', { name: /roadmapTimelineShowMore/ }))
    expect(container.querySelectorAll('[data-release-card]').length).toBe(60)
  })
})
