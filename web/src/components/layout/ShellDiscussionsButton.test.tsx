import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShellDiscussionsButton } from './ShellDiscussionsButton'
import type { Discussion } from '@/lib/discussionsApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-testid="icon">{name}</span>,
}))

vi.mock('@/lib/supabase', () => ({ supabase: {} as unknown }))

vi.mock('@/lib/discussionsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discussionsApi')>()
  return { ...actual, invokeDiscussionsFn: vi.fn() }
})

import { invokeDiscussionsFn } from '@/lib/discussionsApi'

function disc(unread: boolean, id: string): Discussion {
  return {
    id,
    title: id,
    status: 'open',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    reply_count: 0,
    last_reply_at: null,
    linked_journal_entry: null,
    linked_version: null,
    unread,
  }
}

beforeEach(() => {
  vi.mocked(invokeDiscussionsFn).mockReset()
})

describe('ShellDiscussionsButton', () => {
  // BH-01 — кнопка ведёт на /admin/discussions и несёт forum-иконку.
  it('renders a forum link to /admin/discussions', () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: { discussions: [] } })
    render(
      <MemoryRouter>
        <ShellDiscussionsButton />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'admin.discussions.title' })
    expect(link).toHaveAttribute('href', '/admin/discussions')
    expect(screen.getByTestId('icon')).toHaveTextContent('forum')
  })

  // BH-02 — непрочитанные показываются бейджем внутри кнопки шапки.
  it('shows the unread badge count inside the header button', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({
      raw: { discussions: [disc(true, 'a'), disc(true, 'b')] },
    })
    render(
      <MemoryRouter>
        <ShellDiscussionsButton />
      </MemoryRouter>,
    )
    await waitFor(() => expect(invokeDiscussionsFn).toHaveBeenCalled())
    expect(await screen.findByText('2')).toBeInTheDocument()
  })
})
