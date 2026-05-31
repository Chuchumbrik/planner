import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { DeepFocusPrototypePage } from './DeepFocusPrototypePage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/pages/prototypes/PrototypePageLayout', () => ({
  PrototypePageLayout: ({ children, titleKey }: { children: React.ReactNode; titleKey?: string }) => (
    <div data-testid="prototype-layout" data-title={titleKey}>{children}</div>
  ),
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: () => null,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <DeepFocusPrototypePage />
    </MemoryRouter>,
  )
}

describe('DeepFocusPrototypePage', () => {
  it('renders inside PrototypePageLayout with correct titleKey', () => {
    renderPage()
    expect(screen.getByTestId('prototype-layout')).toHaveAttribute(
      'data-title',
      'prototype.deepFocus.title',
    )
  })

  it('renders intro text', () => {
    renderPage()
    expect(screen.getByText('prototype.deepFocus.intro')).toBeInTheDocument()
  })

  it('renders bio section title', () => {
    renderPage()
    expect(screen.getByText('prototype.deepFocus.bioTitle')).toBeInTheDocument()
  })

  it('renders heart rate label', () => {
    renderPage()
    expect(screen.getByText('prototype.deepFocus.heartRate')).toBeInTheDocument()
  })

  it('renders mock timer value', () => {
    renderPage()
    expect(screen.getByText('47:12')).toBeInTheDocument()
  })

  it('renders session label', () => {
    renderPage()
    expect(screen.getByText('prototype.deepFocus.sessionLabel')).toBeInTheDocument()
  })

  it('renders Pause button as disabled (prototype state)', () => {
    renderPage()
    expect(screen.getByText('prototype.deepFocus.pause')).toBeDisabled()
  })

  it('renders Complete button as disabled (prototype state)', () => {
    renderPage()
    expect(screen.getByText('prototype.deepFocus.complete')).toBeDisabled()
  })

  it('renders AI panel title', () => {
    renderPage()
    expect(screen.getByText('prototype.deepFocus.aiTitle')).toBeInTheDocument()
  })
})
