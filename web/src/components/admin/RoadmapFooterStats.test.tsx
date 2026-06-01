import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RoadmapFooterStats } from './RoadmapFooterStats'
import { IDEAS_LATER_ENTRIES, RELEASE_NOTES_BLOCKS } from '@/data/productRoadmap'
import { ideaStatusCounts, releaseCounts } from '@/lib/roadmapStats'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

describe('RoadmapFooterStats', () => {
  it('рендерит группы статистики', () => {
    render(<RoadmapFooterStats />)
    expect(screen.getByText('settings.roadmapStatsReleases')).toBeInTheDocument()
    expect(screen.getByText('settings.roadmapStatsIdeas')).toBeInTheDocument()
    expect(screen.getByText('settings.roadmapStatsDiscussions')).toBeInTheDocument()
  })

  it('показывает реальные счётчики (всего релизов, proposed идей)', () => {
    render(<RoadmapFooterStats />)
    const total = releaseCounts(RELEASE_NOTES_BLOCKS, new Date()).total
    const proposed = ideaStatusCounts(IDEAS_LATER_ENTRIES).proposed
    expect(screen.getAllByText(String(total)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(String(proposed)).length).toBeGreaterThan(0)
  })

  it('клик по sparkline зовёт onSparklineClick', () => {
    const onClick = vi.fn()
    render(<RoadmapFooterStats onSparklineClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'settings.roadmapStatsVelocity' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
