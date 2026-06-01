import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminRoadmapHero } from './AdminRoadmapHero'
import {
  IDEAS_LATER_ENTRIES,
  IMPLEMENTED_MVP_PHASES,
  MVP_PHASES_PLANNED,
} from '@/data/productRoadmap'

const EXPECTED_PCT = Math.round(
  (IMPLEMENTED_MVP_PHASES.length / (IMPLEMENTED_MVP_PHASES.length + MVP_PHASES_PLANNED.length)) * 100,
)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

describe('AdminRoadmapHero', () => {
  it('показывает прогресс MVP и три карточки', () => {
    render(<AdminRoadmapHero />)
    expect(screen.getByText('settings.roadmapHeroStatusTitle')).toBeInTheDocument()
    expect(screen.getByText('settings.roadmapHeroWhatsNew')).toBeInTheDocument()
    expect(screen.getByText('settings.roadmapHeroCurrentFocus')).toBeInTheDocument()
    expect(screen.getByText(`${EXPECTED_PCT}%`)).toBeInTheDocument()
  })

  it('рендерит свежий релиз с версией и тег-чипом', () => {
    render(<AdminRoadmapHero />)
    // последняя версия в семвер-формате
    expect(screen.getByText(/^\d+\.\d+\.\d+$/)).toBeInTheDocument()
  })

  it('quick-links с живыми счётчиками', () => {
    render(<AdminRoadmapHero />)
    expect(screen.getByText('settings.roadmapQuickHistory')).toBeInTheDocument()
    expect(screen.getByText(String(MVP_PHASES_PLANNED.length))).toBeInTheDocument()
    expect(screen.getByText(String(IDEAS_LATER_ENTRIES.length))).toBeInTheDocument()
    // Обсуждения — заглушка до 7.9
    expect(screen.getByText('settings.roadmapQuickDiscussions')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('кнопка «Полный changelog» зовёт onShowChangelog', async () => {
    const onShow = vi.fn()
    render(<AdminRoadmapHero onShowChangelog={onShow} />)
    await userEvent.click(screen.getByRole('button', { name: /roadmapHeroFullChangelog/ }))
    expect(onShow).toHaveBeenCalledOnce()
  })
})
