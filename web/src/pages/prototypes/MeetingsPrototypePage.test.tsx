import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { MeetingsPrototypePage } from './MeetingsPrototypePage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/pages/prototypes/PrototypePageLayout', () => ({
  PrototypePageLayout: ({ children, titleKey }: { children: React.ReactNode; titleKey?: string }) => (
    <div data-testid="prototype-layout" data-title={titleKey}>
      {children}
    </div>
  ),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <MeetingsPrototypePage />
    </MemoryRouter>,
  )
}

describe('MeetingsPrototypePage', () => {
  it('renders inside PrototypePageLayout with correct titleKey', () => {
    renderPage()
    expect(screen.getByTestId('prototype-layout')).toHaveAttribute(
      'data-title',
      'prototype.meetings.title',
    )
  })

  it('renders placeholder image', () => {
    renderPage()
    const img = screen.getByRole('img', { name: 'prototype.meetings.imageAlt' })
    expect(img).toHaveAttribute('src', '/prototype/meetings-placeholder.svg')
  })

  it('renders meeting form and availability sections', () => {
    renderPage()
    expect(screen.getByText('prototype.meetings.formTitle')).toBeInTheDocument()
    expect(screen.getByText('prototype.meetings.availabilityTitle')).toBeInTheDocument()
    expect(screen.getByText('prototype.meetings.createButton')).toBeDisabled()
  })

  it('renders mock availability slots', () => {
    renderPage()
    expect(screen.getByText('prototype.meetings.slotFree')).toBeInTheDocument()
    expect(screen.getAllByText('prototype.meetings.busy').length).toBeGreaterThanOrEqual(2)
  })
})
