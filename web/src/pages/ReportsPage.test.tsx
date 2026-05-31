import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportsPage } from './ReportsPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, _opts?: unknown) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

vi.mock('@/components/ReportHint', () => ({
  ReportHint: ({ label }: { label: string }) => <span data-testid="report-hint">{label}</span>,
}))

vi.mock('@/vault/VaultProvider', () => ({ useVault: vi.fn() }))
vi.mock('@/qa/QaClockProvider', () => ({ useAppNow: vi.fn() }))
vi.mock('@/lib/appNow', () => ({ getAppNow: vi.fn() }))

vi.mock('@motivator/core', () => ({
  reportsWindowKeys: vi.fn(),
  dailyCompletionBuckets: vi.fn(),
  completionDayRate: vi.fn(),
  consecutiveDr013DaysEndingOn: vi.fn(),
  totalCompletionMarksInRange: vi.fn(),
  aggregateRecurringMisses: vi.fn(),
  topOneOffMissesInWindow: vi.fn(),
}))

import { useVault } from '@/vault/VaultProvider'
import { useAppNow } from '@/qa/QaClockProvider'
import { getAppNow } from '@/lib/appNow'
import {
  reportsWindowKeys,
  dailyCompletionBuckets,
  completionDayRate,
  consecutiveDr013DaysEndingOn,
  totalCompletionMarksInRange,
  aggregateRecurringMisses,
  topOneOffMissesInWindow,
} from '@motivator/core'

const EMPTY_VAULT = { tasks: [], eodCompletedLocalDates: [] }

function setupDefaultMocks(overrides: { recurringFails?: any[]; oneOffFails?: any[] } = {}) {
  vi.mocked(useVault).mockReturnValue({ vault: EMPTY_VAULT } as any)
  vi.mocked(useAppNow).mockReturnValue({ tick: 0, enabled: false } as any)
  vi.mocked(getAppNow).mockReturnValue(new Date('2024-06-15T10:00:00Z') as any)
  vi.mocked(reportsWindowKeys).mockReturnValue({
    todayKey: '2024-06-15',
    fromKey: '2024-06-09',
    toKey: '2024-06-15',
  })
  vi.mocked(dailyCompletionBuckets).mockReturnValue([])
  vi.mocked(completionDayRate).mockReturnValue({ ratio: 0.5, daysWithCompletion: 3, totalDays: 7 })
  vi.mocked(consecutiveDr013DaysEndingOn).mockReturnValue(4)
  vi.mocked(totalCompletionMarksInRange).mockReturnValue(12)
  vi.mocked(aggregateRecurringMisses).mockReturnValue(overrides.recurringFails ?? [])
  vi.mocked(topOneOffMissesInWindow).mockReturnValue(overrides.oneOffFails ?? [])
}

beforeEach(() => setupDefaultMocks())

function renderPage() {
  return render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>,
  )
}

describe('ReportsPage — rendering', () => {
  it('renders shell wrapper', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })

  it('renders subtitle text', () => {
    renderPage()
    expect(screen.getByText('reports.subtitle')).toBeInTheDocument()
  })

  it('renders KPI streak value', () => {
    renderPage()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders KPI total marks value', () => {
    renderPage()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders completion rate KPI', () => {
    renderPage()
    expect(screen.getByText('reports.kpiCompletionRateValue')).toBeInTheDocument()
  })

  it('renders DR013 section title', () => {
    renderPage()
    expect(screen.getByText('reports.dr013Title')).toBeInTheDocument()
  })

  it('shows empty state for recurring fails when list is empty', () => {
    renderPage()
    expect(screen.getAllByText('reports.emptyFailed').length).toBeGreaterThan(0)
  })
})

describe('ReportsPage — period switcher', () => {
  it('renders 7-day and 30-day period buttons', () => {
    renderPage()
    expect(screen.getByText('reports.period7')).toBeInTheDocument()
    expect(screen.getByText('reports.period30')).toBeInTheDocument()
  })

  it('switches to 30-day period on click', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('reports.period30'))
    expect(vi.mocked(reportsWindowKeys)).toHaveBeenCalledWith(30, expect.anything())
  })

  it('switches back to 7-day period on click', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('reports.period30'))
    await user.click(screen.getByText('reports.period7'))
    expect(vi.mocked(reportsWindowKeys)).toHaveBeenLastCalledWith(7, expect.anything())
  })
})

describe('ReportsPage — chart', () => {
  it('shows empty chart message when all buckets are zero', () => {
    renderPage()
    expect(screen.getByText('reports.chartEmpty')).toBeInTheDocument()
  })

  it('renders bar chart when buckets have data', () => {
    vi.mocked(dailyCompletionBuckets).mockReturnValue([
      { dateKey: '2024-06-14', count: 3 },
      { dateKey: '2024-06-15', count: 5 },
    ])
    renderPage()
    expect(screen.queryByText('reports.chartEmpty')).not.toBeInTheDocument()
    expect(screen.getByTitle('2024-06-14: 3')).toBeInTheDocument()
    expect(screen.getByTitle('2024-06-15: 5')).toBeInTheDocument()
  })
})

describe('ReportsPage — recurring fails table', () => {
  it('renders recurring fails table when list is non-empty', () => {
    setupDefaultMocks({
      recurringFails: [
        { seriesId: 's1', task: { title: 'Morning run' }, missedCount: 3 },
        { seriesId: 's2', task: { title: 'Read' }, missedCount: 1 },
      ],
    })
    renderPage()
    expect(screen.getByText('Morning run')).toBeInTheDocument()
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows dash for recurring fail with empty title', () => {
    setupDefaultMocks({
      recurringFails: [{ seriesId: 's1', task: { title: '   ' }, missedCount: 2 }],
    })
    renderPage()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('ReportsPage — one-off fails table', () => {
  it('renders one-off fails table when list is non-empty', () => {
    setupDefaultMocks({
      oneOffFails: [
        { task: { id: 't1', title: 'Doctor visit' }, scheduledLocalDate: '2024-06-10' },
      ],
    })
    renderPage()
    expect(screen.getByText('Doctor visit')).toBeInTheDocument()
    expect(screen.getByText('2024-06-10')).toBeInTheDocument()
  })
})
