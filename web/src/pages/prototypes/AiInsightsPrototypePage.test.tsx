import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { AiInsightsPrototypePage } from './AiInsightsPrototypePage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/pages/prototypes/PrototypePageLayout', () => ({
  PrototypePageLayout: ({ children, titleKey }: { children: React.ReactNode; titleKey?: string }) => (
    <div data-testid="prototype-layout" data-title={titleKey}>{children}</div>
  ),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <AiInsightsPrototypePage />
    </MemoryRouter>,
  )
}

describe('AiInsightsPrototypePage', () => {
  it('renders inside PrototypePageLayout with correct titleKey', () => {
    renderPage()
    expect(screen.getByTestId('prototype-layout')).toHaveAttribute(
      'data-title',
      'prototype.aiInsights.title',
    )
  })

  it('renders intro text', () => {
    renderPage()
    expect(screen.getByText('prototype.aiInsights.intro')).toBeInTheDocument()
  })

  it('renders 3 insight articles', () => {
    renderPage()
    const articles = screen.getAllByRole('article')
    expect(articles.length).toBeGreaterThanOrEqual(3)
  })

  it('renders all 3 insight keys as text', () => {
    renderPage()
    expect(screen.getByText('prototype.aiInsights.item1')).toBeInTheDocument()
    expect(screen.getByText('prototype.aiInsights.item2')).toBeInTheDocument()
    expect(screen.getByText('prototype.aiInsights.item3')).toBeInTheDocument()
  })

  it('renders insight percentage values', () => {
    renderPage()
    expect(screen.getByText('84%')).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
    expect(screen.getByText('41%')).toBeInTheDocument()
  })

  it('renders chart title', () => {
    renderPage()
    expect(screen.getByText('prototype.aiInsights.chartTitle')).toBeInTheDocument()
  })
})
