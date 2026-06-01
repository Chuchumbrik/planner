import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ResolveDiscussionModal } from './ResolveDiscussionModal'
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

function renderModal(handlers: Partial<{ onResolved: (d: Discussion) => void; onClose: () => void }> = {}) {
  return render(
    <ResolveDiscussionModal
      discussionId="disc-1"
      supabase={fakeSupabase}
      onResolved={handlers.onResolved ?? (() => {})}
      onClose={handlers.onClose ?? (() => {})}
    />,
  )
}

function submitButton(): HTMLButtonElement {
  // Кнопка отправки — последняя кнопка футера; её подпись меняется на
  // common.loading во время запроса, поэтому ищем по позиции, не по тексту.
  const buttons = screen.getAllByRole('button')
  return buttons[buttons.length - 1] as HTMLButtonElement
}

function summaryInput(): HTMLTextAreaElement {
  return screen.getByPlaceholderText('admin.discussions.resolutionSummaryPlaceholder') as HTMLTextAreaElement
}

beforeEach(() => {
  vi.mocked(invokeDiscussionsFn).mockReset()
  vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: { discussion: { id: 'disc-1' } } })
})

// ── Группа I — ResolveDiscussionModal ────────────────────────────────────────

describe('ResolveDiscussionModal — validation & submit', () => {
  // TS-I01 — пустое summary: кнопка disabled.
  it('disables submit when summary is empty', () => {
    renderModal()
    expect(submitButton()).toBeDisabled()
  })

  // TS-I02 — валидный submit шлёт action: resolve с trim'нутым summary и зовёт onResolved.
  it('submits action "resolve" with trimmed summary and reports the updated thread', async () => {
    const onResolved = vi.fn()
    renderModal({ onResolved })

    await userEvent.type(summaryInput(), '  Итоговое решение  ')
    expect(submitButton()).toBeEnabled()
    await userEvent.click(submitButton())

    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'resolve',
      discussionId: 'disc-1',
      resolutionSummary: 'Итоговое решение',
    })
    await waitFor(() => expect(onResolved).toHaveBeenCalledWith({ id: 'disc-1' }))
  })

  // TS-I03 — кнопки и textarea disabled во время запроса (защита от двойного сабмита).
  it('disables the textarea and buttons while the request is in flight', async () => {
    let resolveFn: (v: { raw: Record<string, unknown> }) => void = () => {}
    vi.mocked(invokeDiscussionsFn).mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve
      }),
    )

    renderModal()
    await userEvent.type(summaryInput(), 'Решение')
    await userEvent.click(submitButton())

    // Во время busy: поле и кнопка отправки заблокированы.
    expect(summaryInput()).toBeDisabled()
    expect(submitButton()).toBeDisabled()
    expect(screen.getByText('common.cancel').closest('button')).toBeDisabled()

    // Разблокируем — запрос завершился.
    resolveFn({ raw: { discussion: { id: 'disc-1' } } })
    await waitFor(() => expect(submitButton()).not.toBeDisabled())
  })

  // TS-I04 — 409 bad_status → i18n-сообщение, не сырой JSON.
  it('shows the i18n staleStatus message on a bad_status error', async () => {
    vi.mocked(invokeDiscussionsFn).mockResolvedValue({ error: '409 bad_status: already resolved' })

    renderModal()
    await userEvent.type(summaryInput(), 'Решение')
    await userEvent.click(submitButton())

    await waitFor(() =>
      expect(screen.getByText('admin.discussions.staleStatus')).toBeInTheDocument(),
    )
    expect(screen.queryByText(/bad_status/)).not.toBeInTheDocument()
  })
})
