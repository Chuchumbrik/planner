import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { PrototypePageLayout } from './PrototypePageLayout'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="shell" data-title={title}>{children}</div>
  ),
}))

vi.mock('@/components/prototypes/PrototypeBanner', () => ({
  PrototypeBanner: () => <div data-testid="prototype-banner" />,
}))

describe('PrototypePageLayout', () => {
  it('renders PrototypeBanner', () => {
    render(
      <MemoryRouter>
        <PrototypePageLayout activeNav="prototype-ai-insights">
          <span />
        </PrototypePageLayout>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('prototype-banner')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <MemoryRouter>
        <PrototypePageLayout activeNav="prototype-ai-insights">
          <div data-testid="child-content" />
        </PrototypePageLayout>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('passes translated titleKey as title to MotivatorShell', () => {
    render(
      <MemoryRouter>
        <PrototypePageLayout activeNav="prototype-ai-insights" titleKey="prototype.aiInsights.title">
          <span />
        </PrototypePageLayout>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('shell')).toHaveAttribute('data-title', 'prototype.aiInsights.title')
  })

  it('passes undefined title when titleKey is omitted', () => {
    render(
      <MemoryRouter>
        <PrototypePageLayout activeNav="prototype-ai-insights">
          <span />
        </PrototypePageLayout>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('shell')).not.toHaveAttribute('data-title')
  })
})
