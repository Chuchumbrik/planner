import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseAuthProvider } from './SupabaseAuthProvider'

const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } })
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}))

vi.mock('@/lib/adminActivityPing', () => ({
  maybeRecordAppActivity: vi.fn(),
}))

describe('SupabaseAuthProvider', () => {
  it('renders children after initial session check', async () => {
    render(
      <SupabaseAuthProvider>
        <span>child</span>
      </SupabaseAuthProvider>,
    )
    await waitFor(() => expect(screen.getByText('child')).toBeInTheDocument())
  })
})
