import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { AdminDiscussionsPage } from './AdminDiscussionsPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="shell" data-title={title}>
      {children}
    </div>
  ),
}))

// Provide a non-null supabase so the page renders content (not a redirect).
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

// Hooks are exercised in their own units; here we only smoke-test the page shell.
vi.mock('@/components/admin/discussions/useDiscussions', () => ({
  useDiscussions: () => ({ discussions: [], loadBusy: false, loadError: null, reload: () => {} }),
}))

vi.mock('@/components/admin/discussions/useDiscussionThread', () => ({
  useDiscussionThread: () => ({
    discussion: null,
    replies: [],
    subscribed: false,
    loadBusy: false,
    loadError: null,
    reload: () => {},
  }),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/discussions" element={<AdminDiscussionsPage />} />
        <Route path="/admin/discussions/:id" element={<AdminDiscussionsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminDiscussionsPage — rendering', () => {
  it('renders the shell wrapper', () => {
    renderAt('/admin/discussions')
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })

  it('renders the discussions title heading', () => {
    renderAt('/admin/discussions')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('admin.discussions.title')
  })

  it('renders the empty-list state when there are no threads', () => {
    renderAt('/admin/discussions')
    expect(screen.getByText('admin.discussions.empty')).toBeInTheDocument()
  })

  it('shows the new-discussion action', () => {
    renderAt('/admin/discussions')
    expect(screen.getByText('admin.discussions.newDiscussion')).toBeInTheDocument()
  })
})
