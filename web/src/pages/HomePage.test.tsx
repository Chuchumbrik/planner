import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HomePage } from './HomePage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/vault/VaultProvider', () => ({
  useVault: vi.fn(),
}))

vi.mock('@/components/brand/BrandMark', () => ({
  BrandMark: () => <div data-testid="brand-mark" />,
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/version', () => ({ APP_VERSION: '0.7.0' }))

import { useAuth } from '@/auth/AuthProvider'
import { useVault } from '@/vault/VaultProvider'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<div data-testid="app-page" />} />
        <Route path="/onboarding" element={<div data-testid="onboarding-page" />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ session: null, loading: false } as any)
  vi.mocked(useVault).mockReturnValue({ ready: true, unlocked: false } as any)
})

describe('HomePage — loading', () => {
  it('shows loading indicator while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: true } as any)
    renderPage()
    expect(screen.getByText('shell.loading')).toBeInTheDocument()
  })

  it('shows loading indicator while vault not ready', () => {
    vi.mocked(useVault).mockReturnValue({ ready: false, unlocked: false } as any)
    renderPage()
    expect(screen.getByText('shell.loading')).toBeInTheDocument()
  })
})

describe('HomePage — redirects', () => {
  it('redirects to /app when session and vault unlocked', () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as any)
    vi.mocked(useVault).mockReturnValue({ ready: true, unlocked: true } as any)
    renderPage()
    expect(screen.getByTestId('app-page')).toBeInTheDocument()
  })

  it('redirects to /onboarding when session but vault locked', () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as any)
    vi.mocked(useVault).mockReturnValue({ ready: true, unlocked: false } as any)
    renderPage()
    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument()
  })
})

describe('HomePage — content (logged out)', () => {
  it('renders brand mark', () => {
    renderPage()
    expect(screen.getByTestId('brand-mark')).toBeInTheDocument()
  })

  it('renders login link in header', () => {
    renderPage()
    const loginLinks = screen.getAllByRole('link').filter(l => l.getAttribute('href') === '/login')
    expect(loginLinks.length).toBeGreaterThan(0)
  })

  it('renders 3 feature cards', () => {
    renderPage()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('renders hero title', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders feature icons', () => {
    renderPage()
    expect(screen.getByTestId('icon-encrypted')).toBeInTheDocument()
    expect(screen.getByTestId('icon-calendar_view_month')).toBeInTheDocument()
    expect(screen.getByTestId('icon-insights')).toBeInTheDocument()
  })
})
