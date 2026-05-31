import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { AdminRoadmapPage } from './AdminRoadmapPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="shell" data-title={title}>{children}</div>
  ),
}))

vi.mock('@/components/ProductRoadmapPanel', () => ({
  ProductRoadmapPanel: () => <div data-testid="roadmap-panel" />,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminRoadmapPage />
    </MemoryRouter>,
  )
}

describe('AdminRoadmapPage — rendering', () => {
  it('renders shell wrapper', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })

  it('renders ProductRoadmapPanel', () => {
    renderPage()
    expect(screen.getByTestId('roadmap-panel')).toBeInTheDocument()
  })

  it('renders h2 heading with roadmap title key', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('settings.roadmapTitle')
  })

  it('renders intro paragraph', () => {
    renderPage()
    expect(screen.getByText('admin.roadmapIntro')).toBeInTheDocument()
  })

  it('passes roadmap title to shell', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toHaveAttribute('data-title', 'settings.roadmapTitle')
  })
})
