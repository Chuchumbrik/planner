import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SyncDiscussionModal } from './SyncDiscussionModal'
import type { Discussion } from '@/lib/discussionsApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/lib/discussionsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discussionsApi')>()
  return { ...actual, invokeDiscussionsFn: vi.fn() }
})

import { invokeDiscussionsFn } from '@/lib/discussionsApi'

const fakeSupabase = {} as SupabaseClient

function renderModal(handlers: Partial<{ onSynced: (d: Discussion) => void; onClose: () => void }> = {}) {
  return render(
    <SyncDiscussionModal
      discussionId="disc-1"
      supabase={fakeSupabase}
      onSynced={handlers.onSynced ?? (() => {})}
      onClose={handlers.onClose ?? (() => {})}
    />,
  )
}

function submitButton(): HTMLButtonElement {
  return screen.getByText('admin.discussions.markSynced').closest('button') as HTMLButtonElement
}

function journalInput(): HTMLInputElement {
  return screen.getByPlaceholderText('admin.discussions.linkedJournalEntryPlaceholder') as HTMLInputElement
}

function versionInput(): HTMLInputElement {
  return screen.getByPlaceholderText('admin.discussions.linkedVersionPlaceholder') as HTMLInputElement
}

beforeEach(() => {
  vi.mocked(invokeDiscussionsFn).mockReset()
  vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: { discussion: { id: 'disc-1' } } })
})

// ── Группа J — SyncDiscussionModal ───────────────────────────────────────────

describe('SyncDiscussionModal — validation & submit', () => {
  // TS-J01 — пустой journalEntry: кнопка disabled.
  it('disables submit when journalEntry is empty', () => {
    renderModal()
    expect(submitButton()).toBeDisabled()
  })

  // TS-J02 — submit без linkedVersion: поля нет в запросе (conditional spread).
  it('omits linkedVersion from the payload when it is empty', async () => {
    renderModal()
    await userEvent.type(journalInput(), '  DR-042  ')
    await userEvent.click(submitButton())

    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'mark-synced',
      discussionId: 'disc-1',
      linkedJournalEntry: 'DR-042',
    })
    // linkedVersion отсутствует в payload.
    const payload = vi.mocked(invokeDiscussionsFn).mock.calls[0][1]
    expect(payload).not.toHaveProperty('linkedVersion')
  })

  // TS-J03 — submit с обоими полями: оба в запросе.
  it('includes both linkedJournalEntry and linkedVersion when provided', async () => {
    renderModal()
    await userEvent.type(journalInput(), 'DR-042')
    await userEvent.type(versionInput(), '0.7.5')
    await userEvent.click(submitButton())

    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'mark-synced',
      discussionId: 'disc-1',
      linkedJournalEntry: 'DR-042',
      linkedVersion: '0.7.5',
    })
  })

  // TS-J04 — 409 bad_status → i18n-сообщение, не сырой JSON.
  it('shows the i18n staleStatus message on a bad_status error', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: '409 bad_status: not pending' })

    renderModal()
    await userEvent.type(journalInput(), 'DR-042')
    await userEvent.click(submitButton())

    await waitFor(() =>
      expect(screen.getByText('admin.discussions.staleStatus')).toBeInTheDocument(),
    )
    expect(screen.queryByText(/bad_status/)).not.toBeInTheDocument()
  })
})
