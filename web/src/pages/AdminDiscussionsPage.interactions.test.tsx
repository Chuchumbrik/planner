import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminDiscussionsPage } from './AdminDiscussionsPage'
import type { Discussion } from '@/lib/discussionsApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

// Non-null supabase so the page renders content (not a redirect).
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

// List hook — not exercised here.
vi.mock('@/components/admin/discussions/useDiscussions', () => ({
  useDiscussions: () => ({ discussions: [], loadBusy: false, loadError: null, reload: () => {} }),
}))

// invokeDiscussionsFn — спай: проверяем точный payload subscribe/unsubscribe.
vi.mock('@/lib/discussionsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discussionsApi')>()
  return { ...actual, invokeDiscussionsFn: vi.fn() }
})

import { invokeDiscussionsFn } from '@/lib/discussionsApi'

// useDiscussionThread мокируется per-test через эту изменяемую ссылку,
// чтобы подменять `subscribed` и шпионить за `reload`.
const threadReload = vi.fn()
let threadSubscribed = false

function makeDiscussion(): Discussion {
  return {
    id: 'thread-1',
    title: 'Тред',
    status: 'open',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    reply_count: 0,
    last_reply_at: null,
    linked_journal_entry: null,
    linked_version: null,
    body: 'Тело',
  } as Discussion
}

vi.mock('@/components/admin/discussions/useDiscussionThread', () => ({
  useDiscussionThread: () => ({
    discussion: makeDiscussion(),
    replies: [],
    subscribed: threadSubscribed,
    loadBusy: false,
    loadError: null,
    reload: threadReload,
  }),
}))

function renderThreadPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/discussions/thread-1']}>
      <Routes>
        <Route path="/admin/discussions" element={<AdminDiscussionsPage />} />
        <Route path="/admin/discussions/:id" element={<AdminDiscussionsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(invokeDiscussionsFn).mockReset()
  threadReload.mockReset()
  threadSubscribed = false
})

describe('AdminDiscussionsPage — subscribe/unsubscribe toggle', () => {
  // AP-01 (High) — клик по кнопке при subscribed:false шлёт action 'subscribe'.
  it('AP-01: dispatches { action: "subscribe", discussionId } when not subscribed', async () => {
    threadSubscribed = false
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: {} })
    renderThreadPage()

    await userEvent.click(screen.getByText('admin.discussions.subscribeNotify'))

    expect(invokeDiscussionsFn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(invokeDiscussionsFn).mock.calls[0][1]).toEqual({
      action: 'subscribe',
      discussionId: 'thread-1',
    })
  })

  // AP-02 (High) — клик по кнопке при subscribed:true шлёт action 'unsubscribe'.
  it('AP-02: dispatches { action: "unsubscribe", discussionId } when subscribed', async () => {
    threadSubscribed = true
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: {} })
    renderThreadPage()

    await userEvent.click(screen.getByText('admin.discussions.unsubscribeNotify'))

    expect(invokeDiscussionsFn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(invokeDiscussionsFn).mock.calls[0][1]).toEqual({
      action: 'unsubscribe',
      discussionId: 'thread-1',
    })
  })

  // AP-03 (Medium, добавлен попутно) — после успешного toggle вызывается reload.
  it('AP-03: reloads the thread after a successful toggle', async () => {
    threadSubscribed = false
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: {} })
    renderThreadPage()

    await userEvent.click(screen.getByText('admin.discussions.subscribeNotify'))

    await waitFor(() => {
      expect(threadReload).toHaveBeenCalledTimes(1)
    })
  })

  // AP-04 (High, регрессор) — при ошибке subscribe пользователь ВИДИТ индикацию,
  // а thread НЕ reload-ится. Прежний gap (тихий сбой) устранён: toggle перенесён
  // в DiscussionThread и проходит через его error/actionBusy-машинерию.
  it('AP-04: surfaces the error and does NOT reload on subscribe failure', async () => {
    threadSubscribed = false
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'subscribe_failed' })
    renderThreadPage()

    await userEvent.click(screen.getByText('admin.discussions.subscribeNotify'))

    expect(await screen.findByText('subscribe_failed')).toBeInTheDocument()
    expect(threadReload).not.toHaveBeenCalled()
  })
})
