import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { FileDefectModal } from './FileDefectModal'
import ruBundle from '@/i18n/locales/ru.json'
import enBundle from '@/i18n/locales/en.json'

// ── i18n mock backed by the real locale bundles ────────────────────────────
// `currentLang` is mutable so a test can flip RU/EN and assert the disclosure
// label actually changes (AC-001-4 / AC-INV-3 — real translation, not key echo).
let currentLang: 'ru' | 'en' = 'en'

type Bundle = Record<string, unknown>

function resolveKey(key: string): string {
  const bundle = (currentLang === 'ru' ? ruBundle : enBundle) as Bundle
  const parts = key.split('.')
  let node: unknown = bundle
  for (const p of parts) {
    if (node && typeof node === 'object' && p in (node as Bundle)) {
      node = (node as Bundle)[p]
    } else {
      return key
    }
  }
  return typeof node === 'string' ? node : key
}

const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
  let out = resolveKey(key)
  if (opts) {
    for (const [k, v] of Object.entries(opts)) {
      out = out.replace(`{{${k}}}`, String(v))
    }
  }
  return out
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT, i18n: { language: currentLang } }),
}))

vi.mock('@/version', () => ({
  APP_VERSION: '0.0.0+test',
  APP_SEMVER: '0.0.0',
  APP_BUILD_REVISION: 'test',
}))

vi.mock('@/lib/useDialogFocusTrap', () => ({ useDialogFocusTrap: () => {} }))
vi.mock('@/lib/defectDeviceMeta', () => ({
  collectDefectDeviceMeta: () => ({
    viewport: '1024x768',
    device_pixel_ratio: 1,
    device_class: 'desktop',
  }),
}))

// Control the submit result per test without touching the network.
const submitMock = vi.fn()
vi.mock('@/hooks/useFileDefect', () => ({
  useFileDefect: () => ({
    submit: submitMock,
    mapFileDefectErrorMessage: (msg: string) => msg,
  }),
}))

// ── supabase stub (storage/db calls used by handleClose/syncDraftPaths) ─────
const mockSupabase = {
  from: () => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
    delete: () => ({ match: vi.fn().mockResolvedValue({ error: null }) }),
  }),
  storage: {
    from: () => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'x' }, error: null }),
    }),
  },
} as unknown as SupabaseClient

function renderModal() {
  let result!: ReturnType<typeof render>
  act(() => {
    result = render(
      <FileDefectModal
        open
        onClose={onClose}
        supabase={mockSupabase}
        localeTag="en"
        pathname="/today"
        userId="user-1"
        motivatorRole="beta_tester"
      />,
    )
  })
  return result
}

const onClose = vi.fn()

// The modal resets its fields in a queueMicrotask on open; let it flush before
// interacting so our input is not wiped by the reset.
async function settleOpen() {
  await act(async () => {
    await Promise.resolve()
  })
}

async function fillRequired() {
  await settleOpen()
  const title = screen.getByPlaceholderText(enBundle.settings.fileDefectTitlePlaceholder)
  const desc = screen.getByPlaceholderText(enBundle.settings.fileDefectDescriptionPlaceholder)
  fireEvent.change(title, { target: { value: 'A title' } })
  fireEvent.change(desc, { target: { value: 'A description' } })
}

beforeEach(() => {
  currentLang = 'en'
  mockT.mockClear()
  submitMock.mockReset()
  onClose.mockReset()
  if (!('randomUUID' in globalThis.crypto)) {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: () => '00000000-0000-0000-0000-000000000000',
      configurable: true,
    })
  }
})

describe('FileDefectModal — validation (negative/boundary)', () => {
  it('empty required fields: does not submit, shows both validation messages', async () => {
    renderModal()
    await settleOpen()
    const submitBtn = screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit })
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(screen.getByText(enBundle.settings.fileDefectValidationTitleRequired)).toBeTruthy()
    })
    expect(screen.getByText(enBundle.settings.fileDefectValidationDescRequired)).toBeTruthy()
    expect(submitMock).not.toHaveBeenCalled()
  })
})

describe('FileDefectModal — submission idempotency', () => {
  it('double-click submit creates exactly one defect (busy guard)', async () => {
    let resolveSubmit: (v: unknown) => void = () => {}
    submitMock.mockImplementation(
      () => new Promise((r) => { resolveSubmit = r }),
    )
    renderModal()
    await fillRequired()
    const submitBtn = screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit })
    fireEvent.click(submitBtn)
    fireEvent.click(submitBtn)
    fireEvent.click(submitBtn)
    expect(submitMock).toHaveBeenCalledTimes(1)
    resolveSubmit({ ok: true, issueUrl: 'https://x/1', suggestedLabels: [] })
    await waitFor(() => {
      expect(screen.getByText(enBundle.settings.fileDefectSuccessTitle)).toBeTruthy()
    })
  })

  it('retry after error does not duplicate: one extra invoke, data preserved', async () => {
    submitMock.mockResolvedValueOnce({ ok: false, errorMessage: 'github_error 500' })
    renderModal()
    await fillRequired()
    const submitBtn = screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit })
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
    })
    // Data preserved after error.
    expect(
      (screen.getByPlaceholderText(enBundle.settings.fileDefectTitlePlaceholder) as HTMLInputElement)
        .value,
    ).toBe('A title')
    // Retry → success.
    submitMock.mockResolvedValueOnce({ ok: true, issueUrl: 'https://x/2', suggestedLabels: [] })
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(screen.getByText(enBundle.settings.fileDefectSuccessTitle)).toBeTruthy()
    })
    expect(submitMock).toHaveBeenCalledTimes(2)
  })
})

describe('FileDefectModal — success/error states (a11y)', () => {
  it('success shows status region with link to the created defect; form not auto-closed', async () => {
    submitMock.mockResolvedValue({ ok: true, issueUrl: 'https://github.com/x/issues/7', suggestedLabels: [] })
    renderModal()
    await fillRequired()
    fireEvent.click(screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit }))
    let status!: HTMLElement
    await waitFor(() => {
      status = screen.getByRole('status')
    })
    const link = within(status).getByRole('link', { name: enBundle.settings.fileDefectOpenIssue })
    expect(link.getAttribute('href')).toBe('https://github.com/x/issues/7')
    expect(onClose).not.toHaveBeenCalled()
    // Close only on explicit user action (the in-body Close button, not the header icon).
    fireEvent.click(within(status).getByRole('button', { name: enBundle.settings.fileDefectClose }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('error shows alert region and keeps the form (no silent close)', async () => {
    submitMock.mockResolvedValue({ ok: false, errorMessage: 'github_error 500' })
    renderModal()
    await fillRequired()
    fireEvent.click(screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
    })
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('FileDefectModal — disclosure i18n (AC-001-4 / AC-INV-3)', () => {
  it('disclosure label is the real EN translation, distinct from the RU one', async () => {
    currentLang = 'en'
    const { unmount } = renderModal()
    await settleOpen()
    expect(screen.getByText(enBundle.settings.fileDefectExtraToggle)).toBeTruthy()
    expect(enBundle.settings.fileDefectExtraToggle).not.toBe(
      ruBundle.settings.fileDefectExtraToggle,
    )
    unmount()
    currentLang = 'ru'
    renderModal()
    await settleOpen()
    expect(screen.getByText(ruBundle.settings.fileDefectExtraToggle)).toBeTruthy()
  })

  it('disclosure toggle exposes expanded state to assistive tech', async () => {
    renderModal()
    await settleOpen()
    const toggle = screen.getByRole('button', { name: enBundle.settings.fileDefectExtraToggle })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})
