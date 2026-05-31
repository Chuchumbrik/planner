import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginPage } from './LoginPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}))

vi.mock('@/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
}))

vi.mock('@/components/brand/BrandMark', () => ({
  BrandMark: () => <div data-testid="brand-mark" />,
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: () => null,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

import { useAuth } from '@/auth/AuthProvider'

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockRequestPasswordReset = vi.fn()


function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    signIn: mockSignIn,
    signUp: mockSignUp,
    requestPasswordReset: mockRequestPasswordReset,
  } as any)
  mockSignIn.mockReset()
  mockSignUp.mockReset()
  mockRequestPasswordReset.mockReset()
  mockNavigate.mockReset()
})

describe('LoginPage — initial render', () => {
  it('shows login title by default', () => {
    renderPage()
    expect(screen.getByText('login.loginTitle')).toBeInTheDocument()
  })

  it('shows email and password inputs', () => {
    renderPage()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument()
  })

  it('shows submit button with login label', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'login.submitLogin' })).toBeInTheDocument()
  })

  it('shows toggle to register', () => {
    renderPage()
    expect(screen.getByText('login.toggleRegister')).toBeInTheDocument()
  })

  it('shows forgot password link', () => {
    renderPage()
    expect(screen.getByText('login.forgotPasswordLink')).toBeInTheDocument()
  })
})

describe('LoginPage — mode switching', () => {
  it('switches to register mode on toggle click', () => {
    renderPage()
    fireEvent.click(screen.getByText('login.toggleRegister'))
    expect(screen.getByText('login.registerTitle')).toBeInTheDocument()
  })

  it('switches to forgot mode on forgot link click', () => {
    renderPage()
    fireEvent.click(screen.getByText('login.forgotPasswordLink'))
    expect(screen.getByText('login.forgotPasswordTitle')).toBeInTheDocument()
  })

  it('returns from forgot to login mode', () => {
    renderPage()
    fireEvent.click(screen.getByText('login.forgotPasswordLink'))
    fireEvent.click(screen.getByText('login.forgotPasswordBack'))
    expect(screen.getByText('login.loginTitle')).toBeInTheDocument()
  })

  it('hides password field in forgot mode', () => {
    renderPage()
    fireEvent.click(screen.getByText('login.forgotPasswordLink'))
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument()
  })

  it('register mode shows submit with register label', () => {
    renderPage()
    fireEvent.click(screen.getByText('login.toggleRegister'))
    expect(screen.getByRole('button', { name: 'login.submitRegister' })).toBeInTheDocument()
  })

  it('clears error when switching modes', () => {
    renderPage()
    // switch to register to trigger mode change
    fireEvent.click(screen.getByText('login.toggleRegister'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('LoginPage — login flow', () => {
  it('calls signIn with trimmed email and password', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    renderPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' user@test.com ' } })
    fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.submitLogin' }))
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'pass123'))
  })

  it('calls navigate to /app on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    renderPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'u@u.com' } })
    fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.submitLogin' }))
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true }))
  })

  it('shows error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    renderPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x@x.com' } })
    fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.submitLogin' }))
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeInTheDocument())
  })

  it('disables submit button while pending', async () => {
    let resolve: (v: any) => void
    mockSignIn.mockReturnValue(new Promise((r) => { resolve = r }))
    renderPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'u@u.com' } })
    fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.submitLogin' }))
    await waitFor(() => expect(screen.getByText('login.pending')).toBeInTheDocument())
    expect(screen.getByText('login.pending')).toBeDisabled()
    await act(async () => { resolve({ error: null }) })
  })
})

describe('LoginPage — register flow', () => {
  it('shows error when submitting without personal data consent', async () => {
    renderPage()
    fireEvent.click(screen.getByText('login.toggleRegister'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new@test.com' } })
    fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.submitRegister' }))
    await waitFor(() => expect(screen.getByText('login.registerPdRequired')).toBeInTheDocument())
  })

  it('does not call signUp without consent', async () => {
    renderPage()
    fireEvent.click(screen.getByText('login.toggleRegister'))
    fireEvent.click(screen.getByRole('button', { name: 'login.submitRegister' }))
    await waitFor(() => expect(mockSignUp).not.toHaveBeenCalled())
  })

  it('shows email confirmation info when signUp returns no session', async () => {
    mockSignUp.mockResolvedValue({ error: null, session: null })
    renderPage()
    fireEvent.click(screen.getByText('login.toggleRegister'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new@test.com' } })
    fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'pass123' } })
    fireEvent.click(document.querySelector('input[type="checkbox"]')!)
    fireEvent.click(screen.getByRole('button', { name: 'login.submitRegister' }))
    await waitFor(() => expect(screen.getByText('login.confirmEmailInfo')).toBeInTheDocument())
  })
})

describe('LoginPage — forgot password flow', () => {
  it('calls requestPasswordReset with trimmed email', async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: null })
    renderPage()
    fireEvent.click(screen.getByText('login.forgotPasswordLink'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' reset@test.com ' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.forgotPasswordSubmit' }))
    await waitFor(() => expect(mockRequestPasswordReset).toHaveBeenCalledWith('reset@test.com'))
  })

  it('shows sent message and returns to login on success', async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: null })
    renderPage()
    fireEvent.click(screen.getByText('login.forgotPasswordLink'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'r@r.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.forgotPasswordSubmit' }))
    await waitFor(() => {
      expect(screen.getByText('login.forgotPasswordSent')).toBeInTheDocument()
      expect(screen.getByText('login.loginTitle')).toBeInTheDocument()
    })
  })
})
