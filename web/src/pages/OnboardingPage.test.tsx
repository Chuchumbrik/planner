import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OnboardingPage } from './OnboardingPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}))

vi.mock('@/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('@/vault/VaultProvider', () => ({ useVault: vi.fn() }))
vi.mock('@/lib/hasRemoteVault', () => ({ hasRemoteVault: vi.fn() }))
vi.mock('@motivator/core', () => ({ generateSeedB64: vi.fn() }))

vi.mock('@/components/brand/BrandMark', () => ({
  BrandMark: () => <div data-testid="brand-mark" />,
}))
vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: () => null,
}))
vi.mock('@/components/SeedKeyImportForm', () => ({
  SeedKeyImportForm: ({ onSubmit }: { onSubmit: (seed: string, kdf: string) => void }) => (
    <button onClick={() => onSubmit('seed', 'kdf')} data-testid="seed-import-form">import</button>
  ),
}))

import { useAuth } from '@/auth/AuthProvider'
import { useVault } from '@/vault/VaultProvider'
import { hasRemoteVault } from '@/lib/hasRemoteVault'
import { generateSeedB64 } from '@motivator/core'

const SESSION = { user: { id: 'user-1' } }

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
        <Route path="/app" element={<div data-testid="app-page" />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ session: SESSION } as any)
  vi.mocked(useVault).mockReturnValue({
    ready: true,
    unlocked: false,
    saveSeed: vi.fn().mockResolvedValue(undefined),
  } as any)
  vi.mocked(hasRemoteVault).mockReturnValue(new Promise(() => {})) // never resolves → mode stays 'loading'
  vi.mocked(generateSeedB64).mockReturnValue('mock-seed-b64')
})

describe('OnboardingPage — guards', () => {
  it('redirects to /login when there is no session', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null } as any)
    renderPage()
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('redirects to /app when vault is already unlocked', () => {
    vi.mocked(useVault).mockReturnValue({ ready: true, unlocked: true, saveSeed: vi.fn() } as any)
    renderPage()
    expect(screen.getByTestId('app-page')).toBeInTheDocument()
  })

  it('shows crypto-loading screen when vault is not ready', () => {
    vi.mocked(useVault).mockReturnValue({ ready: false, unlocked: false, saveSeed: vi.fn() } as any)
    renderPage()
    expect(screen.getByText('shell.loading')).toBeInTheDocument()
  })
})

describe('OnboardingPage — loading mode', () => {
  it('shows initCrypto text while hasRemoteVault is pending', () => {
    renderPage()
    expect(screen.getByText('shell.initCrypto')).toBeInTheDocument()
  })
})

describe('OnboardingPage — restore mode', () => {
  it('shows restore form when hasRemoteVault resolves true', async () => {
    vi.mocked(hasRemoteVault).mockResolvedValue(true)
    renderPage()
    await waitFor(() => expect(screen.getByText('onboarding.restoreTitle')).toBeInTheDocument())
    expect(screen.getByTestId('seed-import-form')).toBeInTheDocument()
  })

  it('shows restore form on probe error', async () => {
    vi.mocked(hasRemoteVault).mockRejectedValue(new Error('network fail'))
    renderPage()
    await waitFor(() => expect(screen.getByText('onboarding.restoreTitle')).toBeInTheDocument())
    expect(screen.getByText('network fail')).toBeInTheDocument()
  })

  it('shows security notice in restore mode', async () => {
    vi.mocked(hasRemoteVault).mockResolvedValue(true)
    renderPage()
    await waitFor(() => expect(screen.getByText('onboarding.securityNotice')).toBeInTheDocument())
  })
})

describe('OnboardingPage — setup mode', () => {
  beforeEach(() => {
    vi.mocked(hasRemoteVault).mockResolvedValue(false)
  })

  it('shows setup form when hasRemoteVault resolves false', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('onboarding.setupTitle')).toBeInTheDocument())
  })

  it('Generate button is visible in setup mode', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('onboarding.generate')).toBeInTheDocument())
  })

  it('Continue button is disabled initially', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('onboarding.continue')).toBeDisabled())
  })

  it('shows seed preview after clicking Generate', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('onboarding.generate'))
    await user.click(screen.getByText('onboarding.generate'))
    expect(screen.getByText('mock-seed-b64')).toBeInTheDocument()
  })

  it('Continue button enabled only after seed generated and ack checked', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('onboarding.generate'))
    await user.click(screen.getByText('onboarding.generate'))
    const ack = screen.getByRole('checkbox')
    expect(ack).toBeEnabled()
    await user.click(ack)
    expect(screen.getByText('onboarding.continue')).toBeEnabled()
  })

  it('calls saveSeed and navigates to /app on Continue', async () => {
    const saveSeed = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useVault).mockReturnValue({ ready: true, unlocked: false, saveSeed } as any)
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('onboarding.generate'))
    await user.click(screen.getByText('onboarding.generate'))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByText('onboarding.continue'))
    await waitFor(() => expect(screen.getByTestId('app-page')).toBeInTheDocument())
    expect(saveSeed).toHaveBeenCalledWith('mock-seed-b64', '')
  })

  it('shows error message when saveSeed throws', async () => {
    const saveSeed = vi.fn().mockRejectedValue(new Error('save failed'))
    vi.mocked(useVault).mockReturnValue({ ready: true, unlocked: false, saveSeed } as any)
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('onboarding.generate'))
    await user.click(screen.getByText('onboarding.generate'))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByText('onboarding.continue'))
    await waitFor(() => expect(screen.getByText('onboarding.errSave')).toBeInTheDocument())
  })
})
