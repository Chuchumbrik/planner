/**
 * Mechanized accessibility checks (quality-baseline §F) for the defect form.
 *
 * Runs axe-core over the modal in its three meaningful states (form / collapsed,
 * form / expanded, success) and asserts there are no violations. This closes the
 * machine-checkable §F items:
 *   - icon-only buttons have accessible names (button-name rule),
 *   - the disclosure exposes its expanded/collapsed state,
 *   - the success link has an accessible name (link-name rule),
 *   - aria-* usage is valid (aria-* rules),
 *   - the live region for the success transition is well-formed.
 *
 * Note on environment: tests run under happy-dom, which does not implement a
 * layout/paint engine, so axe's `color-contrast` rule cannot read computed
 * colors and is disabled here (it is verified visually against the design-system
 * tokens, see §B/§F). Every other applicable WCAG-A/AA rule stays enabled.
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { FileDefectModal } from './FileDefectModal'
import ruBundle from '@/i18n/locales/ru.json'
import enBundle from '@/i18n/locales/en.json'

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

const submitMock = vi.fn()
vi.mock('@/hooks/useFileDefect', () => ({
  useFileDefect: () => ({
    submit: submitMock,
    mapFileDefectErrorMessage: (msg: string) => msg,
  }),
}))

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

const onClose = vi.fn()

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

async function settleOpen() {
  await act(async () => {
    await Promise.resolve()
  })
}

// color-contrast cannot run without a layout engine (happy-dom); everything else stays on.
const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } } as const

function dialog(): HTMLElement {
  return screen.getByRole('dialog')
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

describe('FileDefectModal — axe (quality-baseline §F)', () => {
  it('form state (collapsed) has no accessibility violations', async () => {
    renderModal()
    await settleOpen()
    const results = await axe(dialog(), AXE_OPTS)
    expect(results).toHaveNoViolations()
  })

  it('form state (disclosure expanded) has no accessibility violations', async () => {
    renderModal()
    await settleOpen()
    fireEvent.click(screen.getByRole('button', { name: enBundle.settings.fileDefectExtraToggle }))
    const results = await axe(dialog(), AXE_OPTS)
    expect(results).toHaveNoViolations()
  })

  it('success state (status region + result link) has no accessibility violations', async () => {
    submitMock.mockResolvedValue({
      ok: true,
      issueUrl: 'https://github.com/acme/repo/issues/123',
      suggestedLabels: ['bug'],
    })
    renderModal()
    await settleOpen()
    fireEvent.change(
      screen.getByPlaceholderText(enBundle.settings.fileDefectTitlePlaceholder),
      { target: { value: 'A title' } },
    )
    fireEvent.change(
      screen.getByPlaceholderText(enBundle.settings.fileDefectDescriptionPlaceholder),
      { target: { value: 'A description' } },
    )
    fireEvent.click(screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit }))
    await waitFor(() => screen.getByRole('status'))
    const results = await axe(dialog(), AXE_OPTS)
    expect(results).toHaveNoViolations()
  })
})
