import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CreateDiscussionModal } from './CreateDiscussionModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/lib/discussionsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discussionsApi')>()
  return { ...actual, invokeDiscussionsFn: vi.fn() }
})

import { invokeDiscussionsFn } from '@/lib/discussionsApi'

const fakeSupabase = {} as SupabaseClient

function renderModal(handlers: Partial<{ onCreated: (d: never) => void; onClose: () => void }> = {}) {
  return render(
    <CreateDiscussionModal
      supabase={fakeSupabase}
      onCreated={(handlers.onCreated as never) ?? (() => {})}
      onClose={handlers.onClose ?? (() => {})}
    />,
  )
}

function submitButton(): HTMLButtonElement {
  return screen.getByText('admin.discussions.createSubmit').closest('button') as HTMLButtonElement
}

beforeEach(() => {
  vi.mocked(invokeDiscussionsFn).mockReset()
  vi.mocked(invokeDiscussionsFn).mockResolvedValue({ raw: { discussion: { id: 'new-1' } } })
})

// ── Группа F — CreateDiscussionModal валидация (§7.9 AC-5) ───────────────────

describe('CreateDiscussionModal — validation & submit', () => {
  // TS-F01 — submit заблокирован при пустом title или body.
  it('disables submit when title or body is empty', async () => {
    renderModal()
    const titleInput = screen.getByPlaceholderText('admin.discussions.titlePlaceholder')
    const bodyInput = screen.getByPlaceholderText('admin.discussions.bodyPlaceholder')

    // Изначально оба пусты → disabled.
    expect(submitButton()).toBeDisabled()

    // Только body заполнен → всё ещё disabled.
    await userEvent.type(bodyInput, 'Какое-то тело')
    expect(submitButton()).toBeDisabled()

    // Body очищен, заполнен только title → всё ещё disabled.
    await userEvent.clear(bodyInput)
    await userEvent.type(titleInput, 'Какой-то заголовок')
    expect(submitButton()).toBeDisabled()
  })

  it('does not invoke the edge function when submit is blocked', async () => {
    renderModal()
    await userEvent.type(screen.getByPlaceholderText('admin.discussions.titlePlaceholder'), 'Только заголовок')
    // Кнопка disabled — даже попытка клика ничего не отправляет.
    await userEvent.click(submitButton())
    expect(invokeDiscussionsFn).not.toHaveBeenCalled()
  })

  // TS-F02 — валидные title + body вызывают action: create и onCreated.
  it('submits action "create" with trimmed title/body and reports the created thread', async () => {
    const onCreated = vi.fn()
    renderModal({ onCreated })

    await userEvent.type(screen.getByPlaceholderText('admin.discussions.titlePlaceholder'), '  Заголовок  ')
    await userEvent.type(screen.getByPlaceholderText('admin.discussions.bodyPlaceholder'), '  Тело обсуждения  ')

    expect(submitButton()).toBeEnabled()
    await userEvent.click(submitButton())

    expect(invokeDiscussionsFn).toHaveBeenCalledTimes(1)
    expect(invokeDiscussionsFn).toHaveBeenCalledWith(fakeSupabase, {
      action: 'create',
      title: 'Заголовок',
      body: 'Тело обсуждения',
    })
    expect(onCreated).toHaveBeenCalledWith({ id: 'new-1' })
  })
})
