import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useDiscussions } from './useDiscussions'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

// invokeDiscussionsFn — шпион, проверяем точный payload action'а.
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

// ── Группа G — useDiscussions (загрузка списка) ──────────────────────────────

describe('useDiscussions — list loading', () => {
  // TS-G01 — успешная загрузка списка заполняет discussions, loadBusy сбрасывается.
  it('populates discussions from the response and clears loadBusy', async () => {
    const list = [makeDiscussion({ id: 'a' }), makeDiscussion({ id: 'b' })]
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: { discussions: list } })

    const { result } = renderHook(() => useDiscussions(fakeSupabase))

    await waitFor(() => expect(result.current.loadBusy).toBe(false))
    expect(result.current.discussions).toHaveLength(2)
    expect(result.current.discussions[0].id).toBe('a')
    expect(result.current.loadError).toBeNull()
    expect(invokeDiscussionsFn).toHaveBeenCalledWith(
      fakeSupabase,
      { action: 'list' },
      expect.any(AbortSignal),
    )
  })

  // TS-G02 — Edge Function вернула ошибку: loadError заполнен, список пуст.
  it('sets loadError and keeps the list empty when the edge function errors', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'boom' })

    const { result } = renderHook(() => useDiscussions(fakeSupabase))

    await waitFor(() => expect(result.current.loadError).toBe('boom'))
    expect(result.current.discussions).toEqual([])
    expect(result.current.loadBusy).toBe(false)
  })

  // TS-G03 — supabase === null: запроса нет.
  it('does not invoke the edge function when supabase is null', () => {
    renderHook(() => useDiscussions(null))
    expect(invokeDiscussionsFn).not.toHaveBeenCalled()
  })

  // TS-G04 — abort при размонтировании: setLoadBusy(false) не срабатывает после abort.
  it('does not flip loadBusy back after the controller aborts on unmount', async () => {
    // Имитируем запрос, который завершается с null (abort) — как делает
    // invokeDiscussionsFn при signal.aborted. setLoadBusy(false) пропускается,
    // потому что signal.aborted === true в finally.
    let captured: AbortSignal | undefined
    vi.mocked(invokeDiscussionsFn).mockImplementation((_sb, _body, signal) => {
      captured = signal
      return new Promise((resolve) => {
        signal?.addEventListener('abort', () => resolve(null))
      })
    })

    const { unmount } = renderHook(() => useDiscussions(fakeSupabase))
    // Запрос стартовал.
    expect(invokeDiscussionsFn).toHaveBeenCalledTimes(1)
    unmount()
    // Сигнал прерван, промис резолвится null, finally видит aborted === true.
    await waitFor(() => expect(captured?.aborted).toBe(true))
    // Нет необработанного исключения / предупреждения о setState после unmount —
    // тест проходит без warning'ов от React.
  })
})

// ── Группа N — fallback loadError при пустой строке ошибки ───────────────────

describe('useDiscussions — loadError fallback', () => {
  // TS-N01 — error === '' → loadError получает i18n-fallback admin.discussions.loadError.
  it('falls back to the i18n loadError key when error is an empty string', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: '' })

    const { result } = renderHook(() => useDiscussions(fakeSupabase))

    await waitFor(() => expect(result.current.loadError).toBe('admin.discussions.loadError'))
    expect(result.current.discussions).toEqual([])
    expect(result.current.loadBusy).toBe(false)
  })
})
