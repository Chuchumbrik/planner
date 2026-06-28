import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiAuthProvider } from './ApiAuthProvider'

vi.mock('@/api/authClient', () => ({
  apiLoadSession: vi.fn().mockResolvedValue(null),
  apiLogin: vi.fn(),
  apiRegister: vi.fn(),
  apiLogout: vi.fn(),
  apiRequestPasswordReset: vi.fn(),
  apiUpdatePassword: vi.fn(),
}))

describe('ApiAuthProvider', () => {
  it('renders children after session load finishes', async () => {
    render(
      <ApiAuthProvider>
        <span>child</span>
      </ApiAuthProvider>,
    )
    await waitFor(() => expect(screen.getByText('child')).toBeInTheDocument())
  })
})
