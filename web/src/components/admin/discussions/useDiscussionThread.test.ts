import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useDiscussionThread } from './useDiscussionThread'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/lib/discussionsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discussionsApi')>()
  return { ...actual, invokeDiscussionsFn: vi.fn() }
})

import { invokeDiscussionsFn, type Discussion } from '@/lib/discussionsApi'

const fakeSupabase = {} as SupabaseClient

function makeDiscussion(overrides: Partial<Discussion> = {}): Discussion {
  return {
    id: 'disc-1',
    title: 'Заголовок',
    status: 'open',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    reply_count: 0,
    last_reply_at: null,
    linked_journal_entry: null,
    linked_version: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(invokeDiscussionsFn).mockReset()
})

// ── Группа H — useDiscussionThread (загрузка треда) ──────────────────────────

describe('useDiscussionThread — thread loading', () => {
  // TS-H01 — загрузка треда + replies + subscribed заполняет все три поля.
  it('populates discussion, replies and subscribed from the get response', async () => {
    const d = makeDiscussion({ id: 'A' })
    const replies = [{ id: 'r1', body: 'reply', created_at: '2026-06-01T00:00:00Z', created_by: 'u' }]
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({
      raw: { discussion: d, replies, subscribed: true },
    })

    const { result } = renderHook(() => useDiscussionThread(fakeSupabase, 'A'))

    await waitFor(() => expect(result.current.discussion).not.toBeNull())
    expect(result.current.discussion?.id).toBe('A')
    expect(result.current.replies).toHaveLength(1)
    expect(result.current.subscribed).toBe(true)
    expect(result.current.loadError).toBeNull()
  })

  // TS-H02 — mark-read вызывается fire-and-forget после успешной загрузки.
  it('fires mark-read after a successful load', async () => {
    const d = makeDiscussion({ id: 'A' })
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: { discussion: d, replies: [], subscribed: false } })

    renderHook(() => useDiscussionThread(fakeSupabase, 'A'))

    await waitFor(() =>
      expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
        action: 'mark-read',
        discussionId: 'A',
      }),
    )
    // Первый вызов — get, второй — mark-read.
    expect(invokeDiscussionsFn).toHaveBeenCalledWith(
      fakeSupabase,
      { action: 'get', discussionId: 'A' },
      expect.any(AbortSignal),
    )
  })

  // TS-H03 — ошибка not_found маппится на i18n-строку, не сырой бэкенд-текст.
  it('maps a not_found error to the i18n notFound string', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'not_found: discussion missing' })

    const { result } = renderHook(() => useDiscussionThread(fakeSupabase, 'A'))

    await waitFor(() => expect(result.current.loadError).toBe('admin.discussions.notFound'))
  })

  // TS-H04 — id === null: сброс состояния, запроса нет.
  it('resets state and makes no request when id is null', () => {
    const { result } = renderHook(() => useDiscussionThread(fakeSupabase, null))

    expect(invokeDiscussionsFn).not.toHaveBeenCalled()
    expect(result.current.discussion).toBeNull()
    expect(result.current.replies).toEqual([])
    expect(result.current.subscribed).toBe(false)
  })

  // TS-H05 — смена id: сброс предыдущего + новый запрос на тред B.
  it('reloads the thread when id changes', async () => {
    vi.mocked(invokeDiscussionsFn).mockImplementation((_sb, body) => {
      const b = body as { action: string; discussionId?: string }
      if (b.action === 'get') {
        return Promise.resolve({ raw: { discussion: makeDiscussion({ id: b.discussionId }), replies: [], subscribed: false } })
      }
      return Promise.resolve({ raw: {} })
    })

    const { result, rerender } = renderHook(({ id }) => useDiscussionThread(fakeSupabase, id), {
      initialProps: { id: 'A' },
    })

    await waitFor(() => expect(result.current.discussion?.id).toBe('A'))

    rerender({ id: 'B' })

    await waitFor(() => expect(result.current.discussion?.id).toBe('B'))
    expect(invokeDiscussionsFn).toHaveBeenCalledWith(
      fakeSupabase,
      { action: 'get', discussionId: 'B' },
      expect.any(AbortSignal),
    )
  })
})
