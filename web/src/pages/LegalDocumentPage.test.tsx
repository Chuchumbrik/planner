import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { LegalDocumentPage } from './LegalDocumentPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function renderPage(docId: string) {
  return render(
    <MemoryRouter initialEntries={[`/legal/${docId}`]}>
      <Routes>
        <Route path="/legal/:docId" element={<LegalDocumentPage />} />
        <Route path="/" element={<div data-testid="home" />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LegalDocumentPage — routing', () => {
  it('redirects to / for unknown docId', () => {
    renderPage('unknown')
    expect(screen.getByTestId('home')).toBeInTheDocument()
  })

  it('renders page for privacy', () => {
    renderPage('privacy')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders page for terms', () => {
    renderPage('terms')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders page for personalData', () => {
    renderPage('personalData')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

describe('LegalDocumentPage — content', () => {
  it('back link points to /settings', () => {
    renderPage('privacy')
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/settings')
  })

  it('back link text uses translation key', () => {
    renderPage('privacy')
    expect(screen.getByRole('link').textContent).toBe('legal.backToSettings')
  })

  it('title key includes docId', () => {
    renderPage('terms')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('legal.doc.terms.title')
  })

  it('title key changes per docId', () => {
    renderPage('personalData')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('legal.doc.personalData.title')
  })
})
