import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminRoadmapHero } from './AdminRoadmapHero'
import {
  IDEAS_LATER_ENTRIES,
  IMPLEMENTED_MVP_PHASES,
  MVP_PHASES_PLANNED,
} from '@/data/productRoadmap'
import { useIsDesktopShell } from '@/lib/useMediaQuery'

const EXPECTED_PCT = Math.round(
  (IMPLEMENTED_MVP_PHASES.length / (IMPLEMENTED_MVP_PHASES.length + MVP_PHASES_PLANNED.length)) * 100,
)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

// По умолчанию — десктоп (полный grid), мобильный режим переопределяем в нужном блоке.
vi.mock('@/lib/useMediaQuery', () => ({
  useIsDesktopShell: vi.fn(() => true),
}))

beforeEach(() => {
  vi.mocked(useIsDesktopShell).mockReturnValue(true)
})

afterEach(() => {
  vi.clearAllMocks()
})

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

  it('десктоп: grid из трёх карточек виден, кнопки «Развернуть» нет', () => {
    vi.mocked(useIsDesktopShell).mockReturnValue(true)
    render(<AdminRoadmapHero />)
    expect(screen.getByText('settings.roadmapHeroStatusTitle')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'settings.roadmapHeroExpand' }),
    ).not.toBeInTheDocument()
  })
})

describe('AdminRoadmapHero — mobile collapse (Phase 7.12)', () => {
  beforeEach(() => {
    vi.mocked(useIsDesktopShell).mockReturnValue(false)
  })

  it('по умолчанию свёрнут: сводка + кнопка «Развернуть», карточек нет', () => {
    render(<AdminRoadmapHero />)
    expect(
      screen.getByRole('button', { name: 'settings.roadmapHeroExpand' }),
    ).toBeInTheDocument()
    // Карточка статуса (полный grid) не отрендерена в свёрнутом виде.
    expect(screen.queryByText('settings.roadmapHeroStatusTitle')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.roadmapHeroWhatsNew')).not.toBeInTheDocument()
  })

  it('клик по «Развернуть» показывает три карточки и кнопку «Свернуть»', async () => {
    render(<AdminRoadmapHero />)
    await userEvent.click(screen.getByRole('button', { name: 'settings.roadmapHeroExpand' }))
    expect(screen.getByText('settings.roadmapHeroStatusTitle')).toBeInTheDocument()
    expect(screen.getByText('settings.roadmapHeroWhatsNew')).toBeInTheDocument()
    expect(screen.getByText('settings.roadmapHeroCurrentFocus')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'settings.roadmapHeroCollapse' }),
    ).toBeInTheDocument()
  })

  it('кнопка «Развернуть» имеет корректные aria-атрибуты', () => {
    render(<AdminRoadmapHero />)
    const btn = screen.getByRole('button', { name: 'settings.roadmapHeroExpand' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveAttribute('aria-controls', 'hero-detail')
  })

  // TS-R04 (Must) — кнопка «Свернуть» в развёрнутом виде несёт aria-expanded="true"/aria-controls.
  it('TS-R04: кнопка «Свернуть» имеет aria-expanded="true" и aria-controls="hero-detail"', async () => {
    render(<AdminRoadmapHero />)
    await userEvent.click(screen.getByRole('button', { name: 'settings.roadmapHeroExpand' }))
    const collapseBtn = screen.getByRole('button', { name: 'settings.roadmapHeroCollapse' })
    expect(collapseBtn).toHaveAttribute('aria-expanded', 'true')
    expect(collapseBtn).toHaveAttribute('aria-controls', 'hero-detail')
  })

  // TS-T01 (Must) — в mobile-expanded состоянии #hero-detail несёт класс animate-hero-collapse.
  // ВНИМАНИЕ (jsdom-ограничение): jsdom не исполняет @media (prefers-reduced-motion: reduce),
  // поэтому проверяется только присутствие класса на DOM-узле. CSS-guard
  // `animation: none` для reduced-motion задан в src/index.css (строки ~410–413) и
  // требует e2e (Playwright --force-prefers-reduced-motion) или ручной проверки. TODO: e2e.
  it('TS-T01: #hero-detail несёт animate-hero-collapse в mobile-expanded (CSS-guard — вне jsdom)', async () => {
    render(<AdminRoadmapHero />)
    await userEvent.click(screen.getByRole('button', { name: 'settings.roadmapHeroExpand' }))
    const detail = document.getElementById('hero-detail')
    expect(detail).toBeTruthy()
    expect(detail).toHaveClass('animate-hero-collapse')
  })
})

describe('AdminRoadmapHero — resize mobile→desktop reset (Phase 7.12)', () => {
  // TS-R01 (Must) — ресайз mobile→desktop при expanded=true сбрасывает состояние:
  // кнопки expand/collapse исчезают, grid карточек виден.
  it('TS-R01: ресайз mobile→desktop при expanded сбрасывает состояние (кнопки исчезают, grid виден)', async () => {
    // Стартуем в mobile.
    vi.mocked(useIsDesktopShell).mockReturnValue(false)
    const { rerender } = render(<AdminRoadmapHero />)
    // Разворачиваем на мобиле.
    await userEvent.click(screen.getByRole('button', { name: 'settings.roadmapHeroExpand' }))
    expect(
      screen.getByRole('button', { name: 'settings.roadmapHeroCollapse' }),
    ).toBeInTheDocument()

    // Ресайз к desktop-ширине → adjusting state during render сбрасывает expanded.
    vi.mocked(useIsDesktopShell).mockReturnValue(true)
    rerender(<AdminRoadmapHero />)

    // Кнопки expand/collapse исчезли, grid карточек виден.
    expect(
      screen.queryByRole('button', { name: 'settings.roadmapHeroExpand' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'settings.roadmapHeroCollapse' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('settings.roadmapHeroStatusTitle')).toBeInTheDocument()
    // На десктопе detail-контейнер не несёт анимационный класс (mobile-only).
    expect(document.getElementById('hero-detail')).not.toHaveClass('animate-hero-collapse')
  })
})
