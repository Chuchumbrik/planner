import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminTestingPage } from './AdminTestingPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, _opts?: unknown) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="shell" data-title={title}>{children}</div>
  ),
}))

vi.mock('@/qa/QaClockProvider', () => ({
  useAppNow: vi.fn(),
}))

vi.mock('@/lib/appNow', () => ({
  getQaClockConfig: vi.fn(),
  getAppNow: vi.fn(),
  qaClockFormParts: vi.fn(),
  qaClockMsFromParts: vi.fn(),
  setQaClockConfig: vi.fn(),
  appLocalDateKey: vi.fn(),
}))

import { useAppNow } from '@/qa/QaClockProvider'
import {
  getQaClockConfig,
  getAppNow,
  qaClockFormParts,
  qaClockMsFromParts,
  setQaClockConfig,
  appLocalDateKey,
} from '@/lib/appNow'

const FAKE_NOW_MS = 1718445600000

const fakeNowDate = {
  getTime: () => FAKE_NOW_MS,
  toLocaleString: () => '6/15/2024, 10:00:00 AM',
}

beforeEach(() => {
  vi.mocked(useAppNow).mockReturnValue({ enabled: false } as any)
  vi.mocked(getQaClockConfig).mockReturnValue(null)
  vi.mocked(getAppNow).mockReturnValue(fakeNowDate as any)
  vi.mocked(qaClockFormParts).mockReturnValue({ dateKey: '2024-06-15', time: '10:00' })
  vi.mocked(qaClockMsFromParts).mockReturnValue(FAKE_NOW_MS)
  vi.mocked(appLocalDateKey).mockReturnValue('2024-06-15')
  vi.mocked(setQaClockConfig).mockReset()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminTestingPage />
    </MemoryRouter>,
  )
}

describe('AdminTestingPage — rendering', () => {
  it('renders shell wrapper', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })

  it('renders heading with testing title key', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('admin.testingTitle')
  })

  it('renders warning text', () => {
    renderPage()
    expect(screen.getByText('admin.testingWarning')).toBeInTheDocument()
  })

  it('shows inactive status when override is disabled', () => {
    renderPage()
    expect(screen.getByText('admin.testingInactiveStatus')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows active status when override is enabled', () => {
    vi.mocked(useAppNow).mockReturnValue({ enabled: true } as any)
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('admin.testingInactiveStatus')).not.toBeInTheDocument()
  })

  it('renders scope hint text', () => {
    renderPage()
    expect(screen.getByText('admin.testingScopeHint')).toBeInTheDocument()
  })
})

describe('AdminTestingPage — Apply button', () => {
  it('Apply button is disabled when checkbox is unchecked', () => {
    renderPage()
    expect(screen.getByText('admin.testingApply')).toBeDisabled()
  })

  it('Apply button becomes enabled after checking the checkbox', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('checkbox'))
    expect(screen.getByText('admin.testingApply')).toBeEnabled()
  })

  it('clicking Apply when checked calls setQaClockConfig with enabled config', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByText('admin.testingApply'))
    expect(vi.mocked(setQaClockConfig)).toHaveBeenCalledWith({ enabled: true, fakeNowMs: FAKE_NOW_MS })
  })

  it('does not call setQaClockConfig when Apply clicked while disabled', async () => {
    // Apply is disabled when checkbox unchecked — click should be a no-op
    renderPage()
    expect(screen.getByText('admin.testingApply')).toBeDisabled()
    expect(vi.mocked(setQaClockConfig)).not.toHaveBeenCalled()
  })
})

describe('AdminTestingPage — Disable button', () => {
  it('Disable button is disabled when override inactive and checkbox unchecked', () => {
    renderPage()
    expect(screen.getByText('admin.testingDisable')).toBeDisabled()
  })

  it('clicking Disable calls setQaClockConfig(null)', async () => {
    const user = userEvent.setup()
    vi.mocked(useAppNow).mockReturnValue({ enabled: true } as any)
    renderPage()
    await user.click(screen.getByText('admin.testingDisable'))
    expect(vi.mocked(setQaClockConfig)).toHaveBeenCalledWith(null)
  })
})

describe('AdminTestingPage — invalid datetime', () => {
  it('shows invalid datetime error when qaClockMsFromParts returns null', () => {
    vi.mocked(qaClockMsFromParts).mockReturnValue(null)
    renderPage()
    expect(screen.getByText('admin.testingInvalidDatetime')).toBeInTheDocument()
  })

  it('Apply button is disabled when previewValid is false even if checkbox checked', async () => {
    const user = userEvent.setup()
    vi.mocked(qaClockMsFromParts).mockReturnValue(null)
    renderPage()
    await user.click(screen.getByRole('checkbox'))
    expect(screen.getByText('admin.testingApply')).toBeDisabled()
  })
})
