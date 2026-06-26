/**
 * HIGH-priority scenarios for FileDefectModal
 * (ticket 20260603-134318 — defect-form optimization).
 *
 * Covers the Must-Test scenarios not already exercised by FileDefectModal.test.tsx:
 *   A01/A02/A03  — minimal field set on open + preselected type + hidden fields out of a11y tree
 *   B02/B03/B04  — accordion expand/collapse + inert in collapsed state
 *   B06          — toggling accordion while submitting starts no second submit
 *   C01/C02/C04/C05 — data preserved across collapse/expand, special chars, collapse-during-submit
 *   F01/F02      — success link has a real href + accessible name
 *   G01/G02/G05  — success persists, closes only on explicit action, close blocked while submitting
 *   H03          — hidden-field data preserved after a server error
 *   I02          — submit button disabled while busy
 *   J01/J03/J04  — paste image adds attachment, third paste rejected, pasted text is not an attachment
 */
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { FileDefectModal } from './FileDefectModal'
import ruBundle from '@/i18n/locales/ru.json'
import enBundle from '@/i18n/locales/en.json'

// ── i18n mock backed by the real locale bundles (same shape as the sibling test) ─
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

// ── supabase stub: track storage upload/remove calls for the attachment scenarios ─
const uploadMock = vi.fn().mockResolvedValue({ error: null })
const removeMock = vi.fn().mockResolvedValue({ error: null })
const upsertMock = vi.fn().mockResolvedValue({ error: null })

const mockSupabase = {
  from: () => ({
    upsert: upsertMock,
    delete: () => ({ match: vi.fn().mockResolvedValue({ error: null }) }),
  }),
  storage: {
    from: () => ({
      upload: uploadMock,
      remove: removeMock,
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

// The modal resets its fields in a queueMicrotask on open; flush before interacting.
async function settleOpen() {
  await act(async () => {
    await Promise.resolve()
  })
}

function getTitle() {
  return screen.getByPlaceholderText(enBundle.settings.fileDefectTitlePlaceholder) as HTMLInputElement
}
function getDesc() {
  return screen.getByPlaceholderText(enBundle.settings.fileDefectDescriptionPlaceholder) as HTMLTextAreaElement
}
function getSubmit() {
  return screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit }) as HTMLButtonElement
}
function getAccordion() {
  return screen.getByRole('button', { name: enBundle.settings.fileDefectExtraToggle }) as HTMLButtonElement
}

async function fillRequired() {
  await settleOpen()
  fireEvent.change(getTitle(), { target: { value: 'A title' } })
  fireEvent.change(getDesc(), { target: { value: 'A description' } })
}

// Build a paste event whose clipboardData exposes one image file via `items`.
function makeImagePaste(file: File) {
  const items = [
    { kind: 'file' as const, type: file.type, getAsFile: () => file },
  ]
  return {
    clipboardData: {
      items,
      files: { length: 0, item: () => null },
    },
  }
}

function makeTextPaste(text: string) {
  return {
    clipboardData: {
      items: [{ kind: 'string' as const, type: 'text/plain', getAsFile: () => null }],
      files: { length: 0, item: () => null },
      getData: () => text,
    },
  }
}

function pngFile(name: string) {
  return new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' })
}

function getScreenshotRegion() {
  return screen.getByRole('region', { name: enBundle.settings.fileDefectScreenshotsRegionAria })
}

// The steps placeholder is multiline ("1. …\n2. …\n3. …"); getByPlaceholderText
// normalizes whitespace, so match the raw attribute directly instead.
function getSteps() {
  const el = document.querySelector('textarea[placeholder^="1."]') as HTMLTextAreaElement | null
  if (!el) throw new Error('steps textarea not found')
  return el
}

beforeEach(() => {
  currentLang = 'en'
  mockT.mockClear()
  submitMock.mockReset()
  onClose.mockReset()
  uploadMock.mockClear()
  removeMock.mockClear()
  upsertMock.mockClear()
  if (!('randomUUID' in globalThis.crypto)) {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: () => '00000000-0000-0000-0000-000000000000',
      configurable: true,
    })
  }
})

// ── Группа A — минимальный набор полей при открытии ─────────────────────────
describe('FileDefectModal — initial field set (Группа A)', () => {
  it('TS-A01: on open only title/description are visible; steps/expected/actual are collapsed', async () => {
    renderModal()
    await settleOpen()
    expect(getTitle()).toBeTruthy()
    expect(getDesc()).toBeTruthy()
    // The optional fields live behind the disclosure and start collapsed.
    expect(getAccordion().getAttribute('aria-expanded')).toBe('false')
    // Their placeholders exist in the DOM but inside an inert (a11y-hidden) region.
    const steps = getSteps()
    const region = steps.closest('[inert]')
    expect(region).not.toBeNull()
  })

  it('TS-A02: defect type is preselected as "bug" with no user action', async () => {
    renderModal()
    await settleOpen()
    const select = screen.getByDisplayValue(enBundle.settings.fileDefectType.bug) as HTMLSelectElement
    expect(select.value).toBe('bug')
  })

  it('TS-A03: collapsed optional fields are removed from the accessibility tree (inert)', async () => {
    renderModal()
    await settleOpen()
    const expected = screen.getByPlaceholderText(enBundle.settings.fileDefectExpectedPlaceholder)
    const actual = screen.getByPlaceholderText(enBundle.settings.fileDefectActualPlaceholder)
    expect(expected.closest('[inert]')).not.toBeNull()
    expect(actual.closest('[inert]')).not.toBeNull()
  })
})

// ── Группа B — accordion-поведение ──────────────────────────────────────────
describe('FileDefectModal — accordion behavior (Группа B)', () => {
  it('TS-B02/B03: toggling the disclosure flips aria-expanded and the inert state', async () => {
    renderModal()
    await settleOpen()
    const toggle = getAccordion()
    const steps = getSteps()

    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(steps.closest('[inert]')).not.toBeNull()

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(steps.closest('[inert]')).toBeNull()

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(steps.closest('[inert]')).not.toBeNull()
  })

  it('TS-B06: toggling the accordion while submitting starts no second submit', async () => {
    let resolveSubmit: (v: unknown) => void = () => {}
    submitMock.mockImplementation(() => new Promise((r) => { resolveSubmit = r }))
    renderModal()
    await fillRequired()
    fireEvent.click(getSubmit())
    expect(submitMock).toHaveBeenCalledTimes(1)
    // Toggle disclosure while the request is in flight — must not re-submit.
    fireEvent.click(getAccordion())
    fireEvent.click(getAccordion())
    expect(submitMock).toHaveBeenCalledTimes(1)
    resolveSubmit({ ok: true, issueUrl: 'https://x/1', suggestedLabels: [] })
    await waitFor(() => {
      expect(screen.getByText(enBundle.settings.fileDefectSuccessTitle)).toBeTruthy()
    })
  })
})

// ── Группа C — сохранение данных при раскрытии/сворачивании ─────────────────
describe('FileDefectModal — data preservation (Группа C)', () => {
  it('TS-C01/C02: all three hidden fields keep their values across collapse/expand', async () => {
    renderModal()
    await settleOpen()
    const toggle = getAccordion()
    fireEvent.click(toggle) // expand

    const steps = getSteps()
    const expected = screen.getByPlaceholderText(enBundle.settings.fileDefectExpectedPlaceholder) as HTMLTextAreaElement
    const actual = screen.getByPlaceholderText(enBundle.settings.fileDefectActualPlaceholder) as HTMLTextAreaElement
    fireEvent.change(steps, { target: { value: 'Step 1\nStep 2' } })
    fireEvent.change(expected, { target: { value: 'should pass' } })
    fireEvent.change(actual, { target: { value: 'it failed' } })

    fireEvent.click(toggle) // collapse
    fireEvent.click(toggle) // expand again

    expect((getSteps()).value)
      .toBe('Step 1\nStep 2')
    expect((screen.getByPlaceholderText(enBundle.settings.fileDefectExpectedPlaceholder) as HTMLTextAreaElement).value)
      .toBe('should pass')
    expect((screen.getByPlaceholderText(enBundle.settings.fileDefectActualPlaceholder) as HTMLTextAreaElement).value)
      .toBe('it failed')
  })

  it('TS-C04: special chars / newlines / RTL survive a collapse-expand cycle verbatim', async () => {
    renderModal()
    await settleOpen()
    const toggle = getAccordion()
    fireEvent.click(toggle)
    const special = '✅ Шаг 1\n\n<script>alert(1)</script>\nمرحبا'
    const steps = getSteps()
    fireEvent.change(steps, { target: { value: special } })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect((getSteps()).value)
      .toBe(special)
  })

  it('TS-C05: collapsing during submit does not wipe hidden-field data', async () => {
    let resolveSubmit: (v: unknown) => void = () => {}
    submitMock.mockImplementation(() => new Promise((r) => { resolveSubmit = r }))
    renderModal()
    await fillRequired()
    fireEvent.click(getAccordion()) // expand
    const steps = getSteps()
    fireEvent.change(steps, { target: { value: 'repro steps' } })

    fireEvent.click(getSubmit())
    fireEvent.click(getAccordion()) // collapse mid-flight
    resolveSubmit({ ok: false, errorMessage: 'github_error 500' })
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())

    fireEvent.click(getAccordion()) // expand to inspect
    expect((getSteps()).value)
      .toBe('repro steps')
  })
})

// ── Группа F — ссылка на созданный дефект ───────────────────────────────────
describe('FileDefectModal — created-defect link (Группа F)', () => {
  it('TS-F01/F02: success link carries the real issue URL, opens safely, has an accessible name', async () => {
    submitMock.mockResolvedValue({
      ok: true,
      issueUrl: 'https://github.com/acme/repo/issues/123',
      suggestedLabels: [],
    })
    renderModal()
    await fillRequired()
    fireEvent.click(getSubmit())
    let status!: HTMLElement
    await waitFor(() => { status = screen.getByRole('status') })
    const link = within(status).getByRole('link', { name: enBundle.settings.fileDefectOpenIssue })
    expect(link.getAttribute('href')).toBe('https://github.com/acme/repo/issues/123')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.textContent?.trim()).toBeTruthy()
  })
})

// ── Группа G — устойчивость success-состояния / блокировка закрытия ─────────
describe('FileDefectModal — success persistence & close guard (Группа G)', () => {
  it('TS-G01/G02: success does not auto-close; closes only on explicit user action', async () => {
    submitMock.mockResolvedValue({ ok: true, issueUrl: 'https://x/9', suggestedLabels: [] })
    renderModal()
    await fillRequired()
    fireEvent.click(getSubmit())
    let status!: HTMLElement
    await waitFor(() => { status = screen.getByRole('status') })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(within(status).getByRole('button', { name: enBundle.settings.fileDefectClose }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('TS-G05: closing is blocked while submitting (cancel, overlay, header icon)', async () => {
    let resolveSubmit: (v: unknown) => void = () => {}
    submitMock.mockImplementation(() => new Promise((r) => { resolveSubmit = r }))
    renderModal()
    await fillRequired()
    fireEvent.click(getSubmit())

    // Cancel button.
    fireEvent.click(screen.getByRole('button', { name: enBundle.settings.fileDefectCancel }))
    // Header close icon.
    fireEvent.click(screen.getByRole('button', { name: enBundle.settings.fileDefectClose }))
    // Overlay mousedown.
    const overlay = document.querySelector('[role="presentation"]') as HTMLElement
    fireEvent.mouseDown(overlay, { target: overlay })
    expect(onClose).not.toHaveBeenCalled()

    resolveSubmit({ ok: true, issueUrl: 'https://x/1', suggestedLabels: [] })
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())
  })
})

// ── Группа H — error-состояние, сохранение данных ───────────────────────────
describe('FileDefectModal — error state (Группа H)', () => {
  it('TS-H03: hidden-field data is preserved after a server error', async () => {
    submitMock.mockResolvedValue({ ok: false, errorMessage: 'github_error 500' })
    renderModal()
    await fillRequired()
    fireEvent.click(getAccordion())
    fireEvent.change(getSteps(), {
      target: { value: 'precious steps' },
    })
    fireEvent.click(getSubmit())
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(getTitle().value).toBe('A title')
    expect((getSteps()).value)
      .toBe('precious steps')
  })
})

// ── Группа I — идемпотентность / busy guard ─────────────────────────────────
describe('FileDefectModal — submit busy guard (Группа I)', () => {
  it('TS-I02: submit button is disabled while a submission is in flight', async () => {
    let resolveSubmit: (v: unknown) => void = () => {}
    submitMock.mockImplementation(() => new Promise((r) => { resolveSubmit = r }))
    renderModal()
    await fillRequired()
    // While busy the button label switches to the loading text, so query it by
    // its submit type rather than by accessible name.
    const submitBtn = () => document.querySelector('button[type="submit"]') as HTMLButtonElement
    expect(submitBtn().disabled).toBe(false)
    fireEvent.click(submitBtn())
    await waitFor(() => expect(submitBtn().disabled).toBe(true))
    resolveSubmit({ ok: true, issueUrl: 'https://x/1', suggestedLabels: [] })
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())
  })
})

// ── Группа J — вставка изображений из буфера ────────────────────────────────
describe('FileDefectModal — clipboard image paste (Группа J)', () => {
  it('TS-J01: pasting an image adds an attachment and shows its name', async () => {
    renderModal()
    await settleOpen()
    const region = getScreenshotRegion()
    await act(async () => {
      fireEvent.paste(region, makeImagePaste(pngFile('shot.png')))
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledTimes(1)
      expect(within(region).getByText('shot.png')).toBeTruthy()
    })
  })

  it('TS-J03: a third pasted image is rejected; the first two remain', async () => {
    renderModal()
    await settleOpen()
    const region = getScreenshotRegion()
    await act(async () => {
      fireEvent.paste(region, makeImagePaste(pngFile('a.png')))
      await Promise.resolve()
    })
    await waitFor(() => expect(within(region).getByText('a.png')).toBeTruthy())
    await act(async () => {
      fireEvent.paste(region, makeImagePaste(pngFile('b.png')))
      await Promise.resolve()
    })
    await waitFor(() => expect(within(region).getByText('b.png')).toBeTruthy())

    // Third paste is ignored (region guards on MAX_FILES before reading clipboard).
    await act(async () => {
      fireEvent.paste(region, makeImagePaste(pngFile('c.png')))
      await Promise.resolve()
    })
    expect(uploadMock).toHaveBeenCalledTimes(2)
    expect(within(region).queryByText('c.png')).toBeNull()
    expect(within(region).getByText('a.png')).toBeTruthy()
    expect(within(region).getByText('b.png')).toBeTruthy()
  })

  it('TS-J04: pasting plain text adds no attachment and does not upload', async () => {
    renderModal()
    await settleOpen()
    const region = getScreenshotRegion()
    await act(async () => {
      fireEvent.paste(region, makeTextPaste('Hello world'))
      await Promise.resolve()
    })
    expect(uploadMock).not.toHaveBeenCalled()
    expect(within(region).queryByText('common.delete')).toBeNull()
  })
})

// ── Группа K — идемпотентность через preview-кнопку (AC-INV-2 / GAP-5) ──────
// The "Submit" action exists in two places — the form footer and the preview
// tab's own button. The busy guard must hold on BOTH paths: a double-click on
// the preview submit button still creates exactly one defect.
describe('FileDefectModal — preview-tab submit idempotency (Группа K)', () => {
  function getPreviewTab() {
    return screen.getByRole('button', { name: enBundle.settings.fileDefectTabPreview }) as HTMLButtonElement
  }
  // In preview mode the only submit-like control is the preview submit button
  // (the form footer is unmounted), so query by the submit label directly.
  function getPreviewSubmit() {
    return screen.getByRole('button', { name: enBundle.settings.fileDefectSubmit }) as HTMLButtonElement
  }

  it('TS-K01: double-click submit from the preview tab creates exactly one defect', async () => {
    let resolveSubmit: (v: unknown) => void = () => {}
    submitMock.mockImplementation(() => new Promise((r) => { resolveSubmit = r }))
    renderModal()
    await fillRequired()

    // Switch to the preview tab and submit from there.
    fireEvent.click(getPreviewTab())
    await act(async () => { await Promise.resolve() })
    const submit = getPreviewSubmit()
    fireEvent.click(submit)
    fireEvent.click(submit)
    fireEvent.click(submit)
    expect(submitMock).toHaveBeenCalledTimes(1)

    resolveSubmit({ ok: true, issueUrl: 'https://x/preview-1', suggestedLabels: [] })
    await waitFor(() => {
      expect(screen.getByText(enBundle.settings.fileDefectSuccessTitle)).toBeTruthy()
    })
  })

  it('TS-K02: retry-after-error from the preview tab does not duplicate; data preserved', async () => {
    submitMock.mockResolvedValueOnce({ ok: false, errorMessage: 'github_error 500' })
    renderModal()
    await fillRequired()

    fireEvent.click(getPreviewTab())
    await act(async () => { await Promise.resolve() })
    fireEvent.click(getPreviewSubmit())
    // The submit failed (issueUrl stays null) and the tab stays on preview; the
    // error alert lives in the form view, so switch back to read it. Wait for the
    // in-flight submit to settle first.
    await act(async () => { await Promise.resolve() })
    fireEvent.click(screen.getByRole('button', { name: enBundle.settings.fileDefectTabForm }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBeTruthy())
    // Title is preserved across the failed submit.
    expect(getTitle().value).toBe('A title')

    // Retry from the preview tab → success, exactly one extra invoke.
    fireEvent.click(getPreviewTab())
    await act(async () => { await Promise.resolve() })
    submitMock.mockResolvedValueOnce({ ok: true, issueUrl: 'https://x/preview-2', suggestedLabels: [] })
    fireEvent.click(getPreviewSubmit())
    await waitFor(() => {
      expect(screen.getByText(enBundle.settings.fileDefectSuccessTitle)).toBeTruthy()
    })
    expect(submitMock).toHaveBeenCalledTimes(2)
  })
})
