import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UnreadDiscussionsBadge } from './UnreadDiscussionsBadge'
import type { Discussion } from '@/lib/discussionsApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

// supabase синглтон — truthy-заглушка, чтобы бейдж не возвращал null по !supabase.
vi.mock('@/lib/supabase', () => ({
  supabase: {} as unknown,
}))

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

describe('UnreadDiscussionsBadge', () => {
  // TS-N01 — есть непрочитанные → бейдж с количеством.
  it('renders the unread count when there are unread discussions', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({
      raw: { discussions: [disc(true, 'a'), disc(false, 'b'), disc(true, 'c')] },
    })
    render(<UnreadDiscussionsBadge />)
    expect(await screen.findByText('2')).toBeInTheDocument()
  })

  // TS-N02 — нет непрочитанных → ничего не рендерит.
  it('renders nothing when there are no unread discussions', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({
      raw: { discussions: [disc(false, 'a'), disc(false, 'b')] },
    })
    const { container } = render(<UnreadDiscussionsBadge />)
    await waitFor(() => {
      expect(invokeDiscussionsFn).toHaveBeenCalled()
    })
    expect(container).toBeEmptyDOMElement()
  })

  // TS-N03 — ошибка Edge → бейдж не падает, ничего не показывает.
  it('renders nothing on an Edge error', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'list_failed' })
    const { container } = render(<UnreadDiscussionsBadge />)
    await waitFor(() => {
      expect(invokeDiscussionsFn).toHaveBeenCalled()
    })
    expect(container).toBeEmptyDOMElement()
  })

  // TS-N04 — >99 непрочитанных усекается до «99+».
  it('caps the displayed count at 99+', async () => {
    const many = Array.from({ length: 120 }, (_, i) => disc(true, `d${i}`))
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: { discussions: many } })
    render(<UnreadDiscussionsBadge />)
    expect(await screen.findByText('99+')).toBeInTheDocument()
  })

  // TS-N05 — счётчик «живой»: при возврате фокуса на вкладку (visibilitychange)
  // бейдж перезапрашивает данные и обновляет число.
  it('refetches and updates the count on tab visibilitychange', async () => {
    vi.mocked(invokeDiscussionsFn)
      .mockResolvedValueOnce({ raw: { discussions: [disc(true, 'a')] } })
      .mockResolvedValueOnce({ raw: { discussions: [disc(true, 'a'), disc(true, 'b'), disc(true, 'c')] } })
    render(<UnreadDiscussionsBadge />)
    expect(await screen.findByText('1')).toBeInTheDocument()

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(invokeDiscussionsFn).toHaveBeenCalledTimes(2)
  })

  // BD-01 (High) — bell-shake проигрывается, когда счётчик становится > 0
  // (рост 0 → N при загрузке), затем класс снимается через 700 мс.
  it('applies the bell-shake class when the count grows, then removes it after 700ms', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(invokeDiscussionsFn).mockResolvedValue({
        raw: { discussions: [disc(true, 'a'), disc(true, 'b')] },
      })
      render(<UnreadDiscussionsBadge />)

      // Прогоняем микротаски промиса fetch + эффект пересчёта shake.
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      const badge = screen.getByText('2')
      expect(badge.className).toContain('animate-bell-shake')

      // По истечении 700 мс класс анимации снимается.
      act(() => {
        vi.advanceTimersByTime(700)
      })
      expect(screen.getByText('2').className).not.toContain('animate-bell-shake')
    } finally {
      vi.useRealTimers()
    }
  })
})
