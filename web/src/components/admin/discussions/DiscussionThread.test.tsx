import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DiscussionThread } from './DiscussionThread'
import type { Discussion } from '@/lib/discussionsApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

// AiMarkdown — рендерим как текст, чтобы не тянуть react-markdown в тест.
vi.mock('@/components/ai/AiMarkdown', () => ({
  AiMarkdown: ({ text }: { text: string }) => <div data-testid="markdown">{text}</div>,
}))

// invokeDiscussionsFn — шпион, проверяем точный payload action'а.
vi.mock('@/lib/discussionsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discussionsApi')>()
  return { ...actual, invokeDiscussionsFn: vi.fn() }
})

import { invokeDiscussionsFn } from '@/lib/discussionsApi'

const fakeSupabase = {} as SupabaseClient

function makeDiscussion(overrides: Partial<Discussion> = {}): Discussion {
  return {
    id: 'disc-1',
    title: 'Заголовок треда',
    status: 'open',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    reply_count: 0,
    last_reply_at: null,
    linked_journal_entry: null,
    linked_version: null,
    body: 'Тело треда',
    ...overrides,
  }
}

function renderThread(discussion: Discussion, handlers: Partial<{
  onResolveClick: () => void
  onSyncClick: () => void
  onChanged: () => void
  onBack: () => void
  subscribed: boolean
}> = {}) {
  return render(
    <DiscussionThread
      discussion={discussion}
      replies={[]}
      loadBusy={false}
      supabase={fakeSupabase}
      onBack={handlers.onBack ?? (() => {})}
      onChanged={handlers.onChanged ?? (() => {})}
      onResolveClick={handlers.onResolveClick ?? (() => {})}
      onSyncClick={handlers.onSyncClick ?? (() => {})}
      subscribed={handlers.subscribed ?? false}
    />,
  )
}

beforeEach(() => {
  vi.mocked(invokeDiscussionsFn).mockReset()
  vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: {} })
})

// ── Группа D — статусные переходы → правильный action (§5.3) ─────────────────

describe('DiscussionThread — status transitions dispatch the right action', () => {
  // TS-D01 — «Решить» открывает resolve-модал (resolve action отправляется из ResolveDiscussionModal).
  it('open status: "Решить" triggers the resolve flow via onResolveClick', async () => {
    const onResolveClick = vi.fn()
    renderThread(makeDiscussion({ status: 'open' }), { onResolveClick })

    await userEvent.click(screen.getByText('admin.discussions.resolve'))
    expect(onResolveClick).toHaveBeenCalledTimes(1)
  })

  // TS-D02 — «Перенёс в журнал» открывает sync-модал (mark-synced отправляется из SyncDiscussionModal).
  it('pending-journal status: "Перенёс в журнал" triggers the sync flow via onSyncClick', async () => {
    const onSyncClick = vi.fn()
    renderThread(makeDiscussion({ status: 'pending-journal' }), { onSyncClick })

    await userEvent.click(screen.getByText('admin.discussions.markSynced'))
    expect(onSyncClick).toHaveBeenCalledTimes(1)
  })

  // TS-D03 — «Архивировать» с inline-подтверждением отправляет action: archive.
  it('archive: shows inline confirm, then sends action "archive" with discussionId', async () => {
    const onChanged = vi.fn()
    renderThread(makeDiscussion({ status: 'open' }), { onChanged })

    // Первый клик показывает inline-подтверждение, ничего не шлёт.
    await userEvent.click(screen.getByText('admin.discussions.archive'))
    expect(invokeDiscussionsFn).not.toHaveBeenCalled()
    expect(screen.getByText('admin.discussions.archiveConfirm')).toBeInTheDocument()

    // Подтверждение шлёт archive.
    await userEvent.click(screen.getByText('common.confirm'))
    expect(invokeDiscussionsFn).toHaveBeenCalledTimes(1)
    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'archive',
      discussionId: 'disc-1',
    })
    // После успеха список/тред перезагружаются.
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  // TS-D04 — для synced недоступны кнопки переходов resolve / mark-synced.
  // resolve рендерится только для open, markSynced — только для pending-journal,
  // поэтому на synced их быть не должно.
  it('synced status: resolve and mark-synced buttons are not rendered', () => {
    renderThread(makeDiscussion({ status: 'synced' }))

    expect(screen.queryByText('admin.discussions.resolve')).not.toBeInTheDocument()
    expect(screen.queryByText('admin.discussions.markSynced')).not.toBeInTheDocument()
  })

  // TS-D04 (spec gap) — §5.3 ожидает, что у synced НЕТ кнопки «Архивировать»,
  // но реализация (`status !== 'archived'`) её показывает. Фиксируем расхождение:
  // когда поведение приведут к спецификации, ассерт ниже нужно поменять на
  // `.not.toBeInTheDocument()`.
  it('synced status: archive button is currently STILL rendered (impl vs §5.3 gap)', () => {
    renderThread(makeDiscussion({ status: 'synced' }))
    // Документируем фактическое поведение: archive доступен на synced.
    expect(screen.queryByText('admin.discussions.archive')).toBeInTheDocument()
  })
})

// ── Группа E — reply-форма (§7.9 п.4: reply + Ctrl+Enter) ────────────────────

describe('DiscussionThread — reply form', () => {
  // TS-E01 — кнопка «Отправить» шлёт action: reply с trim'нутым телом и зовёт onChanged.
  it('submit button sends action "reply" with trimmed body and reloads', async () => {
    const onChanged = vi.fn()
    renderThread(makeDiscussion({ status: 'open' }), { onChanged })

    await userEvent.type(screen.getByPlaceholderText('admin.discussions.replyPlaceholder'), '  привет  ')
    await userEvent.click(screen.getByText('admin.discussions.replySubmit'))

    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'reply',
      discussionId: 'disc-1',
      body: 'привет',
    })
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  // TS-E02 — Ctrl+Enter в textarea отправляет reply (горячая клавиша из placeholder).
  it('Ctrl+Enter in the textarea submits the reply', async () => {
    renderThread(makeDiscussion({ status: 'open' }))

    const area = screen.getByPlaceholderText('admin.discussions.replyPlaceholder')
    await userEvent.type(area, 'через клавиатуру{Control>}{Enter}{/Control}')

    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'reply',
      discussionId: 'disc-1',
      body: 'через клавиатуру',
    })
  })

  // TS-E03 — пустой/пробельный ответ не отправляется.
  it('does not submit a blank reply', async () => {
    renderThread(makeDiscussion({ status: 'open' }))

    await userEvent.type(screen.getByPlaceholderText('admin.discussions.replyPlaceholder'), '   ')
    await userEvent.click(screen.getByText('admin.discussions.replySubmit'))

    expect(invokeDiscussionsFn).not.toHaveBeenCalled()
  })

  // TS-E04 — у архивного треда reply-формы нет.
  it('hides the reply form for an archived thread', () => {
    renderThread(makeDiscussion({ status: 'archived' }))
    expect(screen.queryByPlaceholderText('admin.discussions.replyPlaceholder')).not.toBeInTheDocument()
  })
})

// ── Группа M — ветки ошибок reply / archive (§7.9, §5.3) ─────────────────────

describe('DiscussionThread — error branches', () => {
  // TS-M01 — ошибка Edge Function при reply: сообщение об ошибке в DOM, onChanged НЕ вызван.
  it('reply error: shows the error message and does not call onChanged', async () => {
    const onChanged = vi.fn()
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'server_error' })
    renderThread(makeDiscussion({ status: 'open' }), { onChanged })

    await userEvent.type(screen.getByPlaceholderText('admin.discussions.replyPlaceholder'), 'привет')
    await userEvent.click(screen.getByText('admin.discussions.replySubmit'))

    expect(await screen.findByText('server_error')).toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
  })

  // TS-M02 — при ошибке reply текст ответа НЕ очищается (setReplyBody('') только в ветке успеха).
  it('reply error: keeps the typed reply body intact', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'fail' })
    renderThread(makeDiscussion({ status: 'open' }))

    const area = screen.getByPlaceholderText('admin.discussions.replyPlaceholder') as HTMLTextAreaElement
    await userEvent.type(area, 'важный текст')
    await userEvent.click(screen.getByText('admin.discussions.replySubmit'))

    await screen.findByText('fail')
    expect(area.value).toBe('важный текст')
  })

  // TS-M03 — пока reply-запрос в полёте: кнопка «Отправить» и textarea disabled.
  it('reply in-flight: submit button and textarea are disabled', async () => {
    let resolveFn: (value: { raw: Record<string, unknown> }) => void = () => {}
    vi.mocked(invokeDiscussionsFn).mockImplementation(
      () => new Promise((resolve) => { resolveFn = resolve }),
    )
    renderThread(makeDiscussion({ status: 'open' }))

    const area = screen.getByPlaceholderText('admin.discussions.replyPlaceholder')
    await userEvent.type(area, 'в полёте')
    await userEvent.click(screen.getByText('admin.discussions.replySubmit'))

    // Запрос ещё не зарезолвлен → busy-состояние.
    await waitFor(() => {
      expect(screen.getByText('common.loading')).toBeInTheDocument()
    })
    expect(screen.getByText('common.loading').closest('button')).toBeDisabled()
    expect(area).toBeDisabled()

    // Завершаем запрос, чтобы не оставлять висящий промис.
    resolveFn({ raw: {} })
  })

  // TS-M04 — ошибка archive: сообщение в DOM, confirm-режим сброшен, onChanged НЕ вызван.
  it('archive error: shows the error, resets the inline confirm, does not call onChanged', async () => {
    const onChanged = vi.fn()
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'archive_failed' })
    renderThread(makeDiscussion({ status: 'open' }), { onChanged })

    await userEvent.click(screen.getByText('admin.discussions.archive'))
    await userEvent.click(screen.getByText('common.confirm'))

    // Сообщение об ошибке видно.
    expect(await screen.findByText('archive_failed')).toBeInTheDocument()
    // confirmArchive сброшен → снова видна исходная кнопка «Архивировать»,
    // а inline-подтверждение исчезло.
    expect(screen.getByText('admin.discussions.archive')).toBeInTheDocument()
    expect(screen.queryByText('admin.discussions.archiveConfirm')).not.toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
  })
})

// ── Группа P — subscribe / unsubscribe toggle (Phase 7.10 п.4) ────────────────

describe('DiscussionThread — subscribe toggle', () => {
  // TS-P01 — не подписан: клик шлёт action "subscribe" и зовёт onChanged.
  it('not subscribed: click sends action "subscribe" with discussionId and reloads', async () => {
    const onChanged = vi.fn()
    renderThread(makeDiscussion({ status: 'open' }), { subscribed: false, onChanged })

    const btn = screen.getByText('admin.discussions.subscribeNotify')
    expect(btn).toBeInTheDocument()
    await userEvent.click(btn)
    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'subscribe',
      discussionId: 'disc-1',
    })
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  // TS-P02 — подписан: клик шлёт action "unsubscribe" и зовёт onChanged.
  it('subscribed: click sends action "unsubscribe" with discussionId and reloads', async () => {
    const onChanged = vi.fn()
    renderThread(makeDiscussion({ status: 'open' }), { subscribed: true, onChanged })

    const btn = screen.getByText('admin.discussions.unsubscribeNotify')
    expect(btn).toBeInTheDocument()
    await userEvent.click(btn)
    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'unsubscribe',
      discussionId: 'disc-1',
    })
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  // TS-P03 — toggle-кнопка доступна и для архивного треда (нижняя toolbar всегда видна).
  it('archived: subscribe toggle is still rendered', () => {
    renderThread(makeDiscussion({ status: 'archived' }), { subscribed: false })
    expect(screen.getByText('admin.discussions.subscribeNotify')).toBeInTheDocument()
  })

  // TS-P04 — сетевой сбой подписки НЕ молчит: показывается ошибка, onChanged не зовётся.
  // (Бывший gap AP-04: тихий сбой устранён переносом toggle внутрь треда.)
  it('subscribe failure surfaces the error and does NOT reload', async () => {
    const onChanged = vi.fn()
    vi.mocked(invokeDiscussionsFn).mockResolvedValueOnce({ error: 'network down' })
    renderThread(makeDiscussion({ status: 'open' }), { subscribed: false, onChanged })

    await userEvent.click(screen.getByText('admin.discussions.subscribeNotify'))
    expect(await screen.findByText('network down')).toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
  })
})

// ── Группа Q — copy summary + inline sync (Phase 7.11) ───────────────────────

describe('DiscussionThread — copy summary + inline sync', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    writeText.mockClear()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  // TS-Q01 — copy кладёт resolution_summary в буфер и показывает «Скопировано!».
  it('copy: writes the resolution summary to the clipboard and flashes a copied label', async () => {
    renderThread(makeDiscussion({ status: 'pending-journal', resolution_summary: 'Итог решения' }))

    await userEvent.click(screen.getByText('admin.discussions.copySummary'))
    expect(writeText).toHaveBeenCalledWith('Итог решения')
    expect(await screen.findByText('admin.discussions.copiedToClipboard')).toBeInTheDocument()
  })

  // TS-Q02 — inline sync шлёт mark-synced с trim'нутой записью журнала и зовёт onChanged.
  it('inline sync: sends action "mark-synced" with the journal entry and reloads', async () => {
    const onChanged = vi.fn()
    renderThread(makeDiscussion({ status: 'pending-journal', resolution_summary: 'S' }), { onChanged })

    await userEvent.type(screen.getByPlaceholderText('admin.discussions.linkedJournalEntryPlaceholder'), '  DR-016  ')
    await userEvent.click(screen.getByText('admin.discussions.syncInline'))

    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'mark-synced',
      discussionId: 'disc-1',
      linkedJournalEntry: 'DR-016',
    })
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  // TS-Q03 — пустая запись журнала не отправляет mark-synced.
  it('inline sync: does not submit when the journal entry is blank', async () => {
    renderThread(makeDiscussion({ status: 'pending-journal', resolution_summary: 'S' }))

    await userEvent.type(screen.getByPlaceholderText('admin.discussions.linkedJournalEntryPlaceholder'), '   ')
    await userEvent.click(screen.getByText('admin.discussions.syncInline'))

    expect(invokeDiscussionsFn).not.toHaveBeenCalled()
  })

  // TS-Q04 — ошибка bad_status маппится на дружелюбное staleStatus-сообщение, onChanged НЕ зовётся.
  it('inline sync: bad_status error maps to the stale-status message and skips onChanged', async () => {
    const onChanged = vi.fn()
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: 'bad_status' })
    renderThread(makeDiscussion({ status: 'pending-journal', resolution_summary: 'S' }), { onChanged })

    await userEvent.type(screen.getByPlaceholderText('admin.discussions.linkedJournalEntryPlaceholder'), 'DR-099')
    await userEvent.click(screen.getByText('admin.discussions.syncInline'))

    expect(await screen.findByText('admin.discussions.staleStatus')).toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
  })
})
