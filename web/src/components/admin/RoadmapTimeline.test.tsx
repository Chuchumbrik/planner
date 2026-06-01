import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoadmapTimeline } from './RoadmapTimeline'
import { RELEASE_NOTES_BLOCKS } from '@/data/productRoadmap'
import { groupReleasesByDay } from '@/lib/roadmapTimeline'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

const ALL_GROUPS = groupReleasesByDay(RELEASE_NOTES_BLOCKS)

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
