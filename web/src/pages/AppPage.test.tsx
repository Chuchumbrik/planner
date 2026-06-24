import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppPage } from './AppPage'

// ─── i18n ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, _opts?: unknown) => key, i18n: { language: 'en' } }),
}))

// ─── Routing ─────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  }
})

// ─── Auth / Vault guards ──────────────────────────────────────────────────────

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ─── Shell ────────────────────────────────────────────────────────────────────

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="shell" data-title={title}>{children}</div>
  ),
}))

// ─── Heavy child components → stubs ──────────────────────────────────────────

vi.mock('@/components/CreateTaskModal', () => ({
  CreateTaskModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-task-modal" /> : null,
}))

vi.mock('@/components/TaskEditModal', () => ({
  TaskEditModal: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="task-edit-modal" /> : null,
}))

vi.mock('@/components/EndOfDayModal', () => ({
  EndOfDayModal: () => null,
}))

vi.mock('@/components/DayPlanDonut', () => ({
  DayPlanDonut: () => <div data-testid="day-plan-donut" />,
}))

vi.mock('@/components/PeriodPlanDonut', () => ({
  PeriodPlanDonut: () => null,
}))

vi.mock('@/components/PeriodPlanBreakdownChart', () => ({
  PeriodPlanBreakdownChart: () => null,
}))

vi.mock('@/components/MonthCalendar', () => ({
  MonthCalendar: () => <div data-testid="month-calendar" />,
}))

vi.mock('@/components/WeekGrid', () => ({
  WeekGrid: () => <div data-testid="week-grid" />,
}))

vi.mock('@/components/TaskMiniCard', () => ({
  TaskMiniCard: () => null,
}))

vi.mock('@/components/planner/DayPlannerStatsRow', () => ({
  DayPlannerStatsRow: () => null,
}))

vi.mock('@/components/planner/PeriodPlannerStatsRow', () => ({
  PeriodPlannerStatsRow: () => null,
}))

vi.mock('@/components/planner/PlannerCreateFab', () => ({
  PlannerCreateFab: ({
    ariaLabel,
    onClick,
    disabled,
  }: {
    ariaLabel: string
    onClick: () => void
    disabled?: boolean
    variant?: string
    draftCount?: number
    onDraftsClick?: () => void
    draftsBadgeLabel?: string
  }) => (
    <button aria-label={ariaLabel} onClick={onClick} disabled={disabled} data-testid="create-fab">
      {ariaLabel}
    </button>
  ),
}))

vi.mock('@/components/VaultDecryptHelp', () => ({
  VaultDecryptHelp: ({ className }: { className?: string }) => (
    <div data-testid="decrypt-help" className={className} />
  ),
}))

// ─── Providers ────────────────────────────────────────────────────────────────

vi.mock('@/vault/VaultProvider', () => ({ useVault: vi.fn() }))
vi.mock('@/qa/QaClockProvider', () => ({ useAppNow: vi.fn() }))

// ─── Lib utilities ────────────────────────────────────────────────────────────

vi.mock('@/lib/appNow', () => ({
  appLocalDateKey: vi.fn(() => '2024-06-15'),
  getAppNow: vi.fn(() => new Date('2024-06-15T10:00:00Z')),
}))

vi.mock('@/lib/plannerChartsP ref', () => ({
  readPlannerChartsHidden: vi.fn(() => false),
  writePlannerChartsHidden: vi.fn(),
}))

vi.mock('@/lib/plannerFilterScope', () => ({
  tasksVisibleInPlannerView: vi.fn(() => []),
}))

vi.mock('@/lib/connectivityHints', () => ({
  humanizeConnectivityError: vi.fn((_err: unknown, t: (k: string) => string) => t('app.syncError')),
  isLikelyNetworkFetchFailure: vi.fn(() => false),
}))

vi.mock('@/lib/plannerPeriodStats', () => ({
  countHiddenByFilterInDays: vi.fn(() => 0),
  countOverdueInDays: vi.fn(() => 0),
  summarizePlannerDay: vi.fn(() => ({ total: 0, done: 0, overdue: 0, taskColors: [] })),
}))

vi.mock('@/lib/plannerTaskDayStatus', () => ({
  isPlannerTaskOverdue: vi.fn(() => false),
}))

vi.mock('@/lib/useDialogFocusTrap', () => ({
  useDialogFocusTrap: vi.fn(),
}))

vi.mock('@motivator/core', () => ({
  DEFAULT_GROUP_ID: 'default',
  PRIORITY_RANKS: [1, 2, 3],
  maxOverlapWithOthers: vi.fn(() => 0),
  monthLabel: vi.fn(() => 'June 2024'),
  monthWeekMatrix: vi.fn(() => []),
  parseLocalDateKey: vi.fn(() => new Date('2024-06-15T00:00:00')),
  shiftLocalDateKey: vi.fn((k: string) => k),
  shiftWeekStartMonday: vi.fn((k: string) => k),
  startOfWeekMonday: vi.fn(() => '2024-06-10'),
  isMainTaskDoneForDay: vi.fn(() => false),
  isPlannedTaskFullyCompleteForDay: vi.fn(() => false),
  plannedDayCompletionWeights: vi.fn(() => ({ planned: 0, done: 0 })),
  plannedPeriodProgress: vi.fn(() => ({ planned: 0, done: 0 })),
  plannedPeriodSlotsByColorKey: vi.fn(() => []),
  plannedPeriodSlotsByGroupId: vi.fn(() => []),
  taskOccursOnDate: vi.fn(() => false),
  tasksScheduledForPlannerDay: vi.fn(() => []),
  getTaskSlotMinutes: vi.fn(() => 0),
  weekDayKeys: vi.fn(() => [
    '2024-06-10', '2024-06-11', '2024-06-12',
    '2024-06-13', '2024-06-14', '2024-06-15', '2024-06-16',
  ]),
  withTaskPatch: vi.fn((task: unknown, _patch: unknown) => task),
}))

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { useVault } from '@/vault/VaultProvider'
import { useAppNow } from '@/qa/QaClockProvider'

// ─── Fixture data ─────────────────────────────────────────────────────────────

const VAULT_BASE = {
  tasks: [],
  drafts: [],
  groups: [{ id: 'default', name: 'Default', sortOrder: 0 }],
  priorityLabels: { 1: 'Low', 2: 'Medium', 3: 'High' },
  eodPreferences: { enabled: true, autoCloseAtDayEnd: false },
  eodCompletedLocalDates: [],
  notificationPreferences: null,
}

const VAULT_METHODS = {
  retrySync: vi.fn(),
  awaitVaultSync: vi.fn(),
  createTask: vi.fn().mockResolvedValue(undefined),
  upsertDraft: vi.fn().mockResolvedValue(undefined),
  deleteDraft: vi.fn().mockResolvedValue(undefined),
  toggleTask: vi.fn().mockResolvedValue(undefined),
  removeTask: vi.fn().mockResolvedValue(undefined),
  skipTaskOccurrenceForDay: vi.fn().mockResolvedValue(undefined),
  setTaskColor: vi.fn().mockResolvedValue(undefined),
  setTaskGroup: vi.fn().mockResolvedValue(undefined),
  addChecklistItem: vi.fn().mockResolvedValue(undefined),
  toggleChecklistItem: vi.fn().mockResolvedValue(undefined),
  removeChecklistItem: vi.fn().mockResolvedValue(undefined),
  setTaskPriorityRank: vi.fn().mockResolvedValue(undefined),
  setTaskScheduledLocalDate: vi.fn().mockResolvedValue(undefined),
  setTaskEstimatedMinutes: vi.fn().mockResolvedValue(undefined),
  setTaskTimePlan: vi.fn().mockResolvedValue(undefined),
  patchTask: vi.fn().mockResolvedValue(undefined),
  completeEodForLocalDate: vi.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  vi.mocked(useVault).mockReturnValue({
    vault: VAULT_BASE,
    remoteHydrated: true,
    decryptFailed: false,
    remoteError: null,
    savePending: false,
    ...VAULT_METHODS,
  } as any)
  vi.mocked(useAppNow).mockReturnValue({
    todayKey: '2024-06-15',
    now: new Date('2024-06-15T10:00:00Z'),
    tick: 0,
    enabled: false,
  } as any)
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<AppPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AppPage — rendering', () => {
  it('renders shell wrapper', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })

  it('passes planner title to shell', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toHaveAttribute('data-title', 'app.plannerTitle')
  })

  it('renders view nav with day/week/month tabs', () => {
    renderPage()
    const nav = screen.getByRole('navigation', { name: 'app.viewNavAria' })
    expect(within(nav).getByRole('tab', { name: 'app.viewDay' })).toBeInTheDocument()
    expect(within(nav).getByRole('tab', { name: 'app.viewWeek' })).toBeInTheDocument()
    expect(within(nav).getByRole('tab', { name: 'app.viewMonth' })).toBeInTheDocument()
  })

  it('day tab is selected by default', () => {
    renderPage()
    expect(screen.getByRole('tab', { name: 'app.viewDay' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'app.viewWeek' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('renders filter toggle button', () => {
    renderPage()
    expect(screen.getByText('app.filterToggle')).toBeInTheDocument()
  })

  it('renders create FAB', () => {
    renderPage()
    expect(screen.getAllByTestId('create-fab').length).toBeGreaterThan(0)
  })

  it('create task modal is closed by default', () => {
    renderPage()
    expect(screen.queryByTestId('create-task-modal')).not.toBeInTheDocument()
  })
})

describe('AppPage — loading & error states', () => {
  it('shows blocking loading overlay when vault not yet hydrated', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: false,
      decryptFailed: false,
      remoteError: null,
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('app.syncBlockingTitle')).toBeInTheDocument()
  })

  it('shows retry button in overlay when remoteError is set and not hydrated', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: false,
      decryptFailed: false,
      remoteError: new Error('timeout'),
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.getByText('app.syncRetry')).toBeInTheDocument()
  })

  it('retry button calls retrySync', async () => {
    const retrySync = vi.fn()
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: false,
      decryptFailed: false,
      remoteError: new Error('timeout'),
      savePending: false,
      ...VAULT_METHODS,
      retrySync,
    } as any)
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('app.syncRetry'))
    expect(retrySync).toHaveBeenCalled()
  })

  it('shows decrypt help when decryptFailed is true', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: true,
      decryptFailed: true,
      remoteError: null,
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.getByTestId('decrypt-help')).toBeInTheDocument()
  })

  it('shows inline error banner when hydrated but remoteError is set', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: true,
      decryptFailed: false,
      remoteError: new Error('sync failed'),
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    // inline retry button (not the overlay one)
    expect(screen.getByText('app.syncRetry')).toBeInTheDocument()
  })

  it('filter toggle is disabled when vault cannot be edited (not hydrated)', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: false,
      decryptFailed: false,
      remoteError: null,
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.getByText('app.filterToggle')).toBeDisabled()
  })
})

describe('AppPage — view switching', () => {
  it('switching to Week sets week tab as selected', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: 'app.viewWeek' }))
    expect(screen.getByRole('tab', { name: 'app.viewWeek' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'app.viewDay' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('switching to Month sets month tab as selected', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: 'app.viewMonth' }))
    expect(screen.getByRole('tab', { name: 'app.viewMonth' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('switching back to Day from Week works', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: 'app.viewWeek' }))
    await user.click(screen.getByRole('tab', { name: 'app.viewDay' }))
    expect(screen.getByRole('tab', { name: 'app.viewDay' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})

describe('AppPage — toolbar interactions', () => {
  it('filter panel is closed by default (aria-expanded=false)', () => {
    renderPage()
    expect(screen.getByText('app.filterToggle')).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking filter toggle opens the filter panel', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('app.filterToggle'))
    expect(screen.getByText('app.filterToggle')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText('app.filtersTitle').length).toBeGreaterThan(0)
  })

  it('clicking filter toggle again closes the panel', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('app.filterToggle'))
    await user.click(screen.getByText('app.filterToggle'))
    expect(screen.getByText('app.filterToggle')).toHaveAttribute('aria-expanded', 'false')
  })

  it('create FAB opens the create task modal', async () => {
    const user = userEvent.setup()
    renderPage()
    // Click the first (md: inline) or second (mobile: fixed) FAB — both trigger openCreateTask
    const fabs = screen.getAllByTestId('create-fab')
    await user.click(fabs[0])
    expect(screen.getByTestId('create-task-modal')).toBeInTheDocument()
  })
})
