import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockIsApiConfigured, mockIsSupabaseConfigured } = vi.hoisted(() => ({
  mockIsApiConfigured: vi.fn(() => false),
  mockIsSupabaseConfigured: vi.fn(() => false),
}))

vi.mock('@/lib/apiConfig', () => ({
  isApiConfigured: () => mockIsApiConfigured(),
}))

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured()
  },
}))

vi.mock('./ApiAuthProvider', () => ({
  ApiAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-auth-provider">{children}</div>
  ),
}))

vi.mock('./SupabaseAuthProvider', () => ({
  SupabaseAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="supabase-auth-provider">{children}</div>
  ),
}))

import { AuthProvider, useAuth } from './AuthProvider'

const UNCONFIGURED_ERROR =
  'Задайте VITE_API_URL (Amvera) или VITE_SUPABASE_* (legacy Vercel)'

function SignInProbe() {
  const { signIn } = useAuth()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <>
      <button type="button" onClick={() => void signIn('a@b.c', 'pass').then(({ error }) => setMessage(error?.message ?? null))}>
        Sign in
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </>
  )
}

function UnconfiguredDefaultsProbe() {
  const { loading, session, isAdmin, isBetaTester, canAccessPreviewFeatures } = useAuth()

  return (
    <output aria-label="auth defaults">
      loading:{String(loading)} session:{session === null ? 'null' : 'set'} admin:{String(isAdmin)} beta:{String(isBetaTester)} preview:{String(canAccessPreviewFeatures)}
    </output>
  )
}

function SignUpProbe() {
  const { signUp } = useAuth()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void signUp('a@b.c', 'pass').then(({ error, session }) =>
            setMessage(error?.message ?? (session === null ? 'no-session' : 'has-session')),
          )
        }
      >
        Sign up
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </>
  )
}

function SignOutProbe() {
  const { signOut } = useAuth()
  const [status, setStatus] = useState<'idle' | 'done'>('idle')

  return (
    <>
      <button type="button" onClick={() => void signOut().then(() => setStatus('done'))}>
        Sign out
      </button>
      {status === 'done' ? <p role="status">signed out</p> : null}
    </>
  )
}

function PasswordActionsProbe() {
  const { requestPasswordReset, updatePassword } = useAuth()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void requestPasswordReset('a@b.c').then(({ error }) => setMessage(error?.message ?? null))
        }
      >
        Reset password
      </button>
      <button
        type="button"
        onClick={() =>
          void updatePassword('old', 'new').then(({ error }) => setMessage(error?.message ?? null))
        }
      >
        Update password
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </>
  )
}

beforeEach(() => {
  mockIsApiConfigured.mockReturnValue(false)
  mockIsSupabaseConfigured.mockReturnValue(false)
})

describe('AuthProvider — backend selection', () => {
  it('uses ApiAuthProvider when isApiConfigured() is true', () => {
    mockIsApiConfigured.mockReturnValue(true)
    mockIsSupabaseConfigured.mockReturnValue(false)

    render(
      <AuthProvider>
        <span>child</span>
      </AuthProvider>,
    )

    expect(screen.getByTestId('api-auth-provider')).toBeInTheDocument()
    expect(screen.queryByTestId('supabase-auth-provider')).not.toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('uses SupabaseAuthProvider when API is false and Supabase is configured', () => {
    mockIsApiConfigured.mockReturnValue(false)
    mockIsSupabaseConfigured.mockReturnValue(true)

    render(
      <AuthProvider>
        <span>child</span>
      </AuthProvider>,
    )

    expect(screen.getByTestId('supabase-auth-provider')).toBeInTheDocument()
    expect(screen.queryByTestId('api-auth-provider')).not.toBeInTheDocument()
  })

  it('prefers ApiAuthProvider when both API and Supabase are configured', () => {
    mockIsApiConfigured.mockReturnValue(true)
    mockIsSupabaseConfigured.mockReturnValue(true)

    render(
      <AuthProvider>
        <span>child</span>
      </AuthProvider>,
    )

    expect(screen.getByTestId('api-auth-provider')).toBeInTheDocument()
    expect(screen.queryByTestId('supabase-auth-provider')).not.toBeInTheDocument()
  })

  it('uses unconfigured stub when neither backend is configured', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <SignInProbe />
      </AuthProvider>,
    )

    expect(screen.queryByTestId('api-auth-provider')).not.toBeInTheDocument()
    expect(screen.queryByTestId('supabase-auth-provider')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(UNCONFIGURED_ERROR)
  })

  it('exposes idle defaults in unconfigured mode', () => {
    render(
      <AuthProvider>
        <UnconfiguredDefaultsProbe />
      </AuthProvider>,
    )

    expect(screen.getByRole('status', { name: 'auth defaults' })).toHaveTextContent(
      'loading:false session:null admin:false beta:false preview:false',
    )
  })

  it('returns configuration error from signUp in unconfigured mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <SignUpProbe />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(UNCONFIGURED_ERROR)
  })

  it('resolves signOut without error in unconfigured mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <SignOutProbe />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('status')).toHaveTextContent('signed out')
  })

  it('returns configuration error from password actions in unconfigured mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <PasswordActionsProbe />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(UNCONFIGURED_ERROR)

    await user.click(screen.getByRole('button', { name: 'Update password' }))
    expect(screen.getByRole('alert')).toHaveTextContent(UNCONFIGURED_ERROR)
  })
})

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    function Outside() {
      useAuth()
      return null
    }

    expect(() => render(<Outside />)).toThrow('useAuth вне AuthProvider')
  })
})
