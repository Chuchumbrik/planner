import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RoadmapPlanIdeas } from './RoadmapPlanIdeas'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

describe('RoadmapPlanIdeas', () => {
  it('две секции — План и Идеи', () => {
    render(<RoadmapPlanIdeas />)
    expect(screen.getByRole('heading', { name: /roadmapMvp/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /roadmapIdeas/ })).toBeInTheDocument()
  })

  it('текущая фаза помечена бейджем «Сейчас»', () => {
    render(<RoadmapPlanIdeas />)
    expect(screen.getByText('settings.roadmapPlanNow')).toBeInTheDocument()
  })

  it('идеи показывают status-чип (proposed после бэкфилла)', () => {
    render(<RoadmapPlanIdeas />)
    expect(screen.getAllByText('settings.roadmapIdeaStatus_proposed').length).toBeGreaterThan(0)
  })
})
