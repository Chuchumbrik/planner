import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AdminDashboardSummaryTab } from './AdminDashboardSummaryTab'
import type { AdminOverview } from '@/types/adminMonitoring'

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockT = vi.fn((key: string) => key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/components/admin/InfoTooltip', () => ({
  InfoTooltip: () => null,
}))

vi.mock('@/components/admin/AdminKpiCard', () => ({
  AdminKpiCard: ({ loading, value, labelKey }: { loading?: boolean; value: string; labelKey: string }) => (
    <div data-testid={`kpi-${labelKey}`}>
      {loading ? <div data-testid="kpi-skeleton" /> : <span>{value}</span>}
    </div>
  ),
}))

vi.mock('@/components/admin/AdminKpiChartZone', () => ({
  AdminKpiChartZone: () => <div data-testid="kpi-chart-zone" />,
}))

vi.mock('@/components/admin/AdminDashboardActivityChart', () => ({
  AdminDashboardActivityChart: () => <div data-testid="activity-chart" />,
}))

vi.mock('@/components/admin/useAdminActivityChart', () => ({
  useAdminActivityChart: () => ({
    chart: null,
    loadBusy: false,
    loadError: null,
    tableMissing: false,
    load: vi.fn(),
  }),
}))

vi.mock('@/components/admin/useAdminKpiTrend', () => ({
  useAdminKpiTrend: () => ({
    trend: null,
    loadBusy: false,
    loadError: null,
    tableMissing: false,
    reload: vi.fn(),
  }),
}))

beforeEach(() => mockT.mockClear())

// ── helpers ───────────────────────────────────────────────────────────────────

const mockSupabase = {} as SupabaseClient

function overview(partial: Partial<AdminOverview> = {}): AdminOverview {
  return {
    total_users: 100,
    registered_last_7d: 5,
    signed_in_last_7d: 30,
    with_vault: 80,
    without_vault: 20,
    vault_stale_14d: 0,
    with_push: 50,
    defect_submissions_7d: 0,
    mau_30d: 70,
    by_role: { admin: 1, beta_tester: 3, user: 96 },
    stale_vault_days: 14,
    ...partial,
  }
}

function renderTab(
  props: Partial<React.ComponentProps<typeof AdminDashboardSummaryTab>> = {},
) {
  return render(
    <AdminDashboardSummaryTab
      overview={overview()}
      loadBusy={false}
      loadError={null}
      listDegraded={false}
      supabase={mockSupabase}
      {...props}
    />,
  )
}

// ── Status banners (TS-022, TS-024, TS-025) ───────────────────────────────────

describe('AdminDashboardSummaryTab — status banners', () => {
  it('shows error banner when loadError is set (TS-022)', () => {
    renderTab({ overview: null, loadBusy: false, loadError: 'Network error' })
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows degraded banner when listDegraded=true (TS-024)', () => {
    renderTab({ listDegraded: true })
    expect(screen.getByText('admin.dashboard.listDegraded')).toBeInTheDocument()
  })

  it('shows both banners simultaneously (TS-025)', () => {
    renderTab({ overview: null, loadError: 'Server error', listDegraded: true })
    expect(screen.getByText('Server error')).toBeInTheDocument()
    expect(screen.getByText('admin.dashboard.listDegraded')).toBeInTheDocument()
  })

  it('no error banner when loadError is null', () => {
    renderTab({ loadError: null })
    expect(screen.queryByText('Network error')).not.toBeInTheDocument()
  })

  it('no degraded banner when listDegraded=false', () => {
    renderTab({ listDegraded: false })
    expect(screen.queryByText('admin.dashboard.listDegraded')).not.toBeInTheDocument()
  })
})

// ── Skeleton states (TS-053, TS-054) ─────────────────────────────────────────

describe('AdminDashboardSummaryTab — skeleton states', () => {
  it('shows KPI skeletons on initial mount: overview=null, no error (TS-053)', () => {
    renderTab({ overview: null, loadBusy: false, loadError: null })
    expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4)
  })

  it('keeps data visible during refresh — no skeletons when overview already loaded', () => {
    // loadBusy=true but overview is populated: stale data should show, not skeletons
    renderTab({ loadBusy: true, overview: overview() })
    expect(screen.queryAllByTestId('kpi-skeleton')).toHaveLength(0)
  })

  it('shows KPI skeletons on initial load when loadBusy=true and no data yet', () => {
    renderTab({ loadBusy: true, overview: null })
    expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4)
  })

  it('hides KPI skeletons when loadError is set (TS-054)', () => {
    renderTab({ overview: null, loadBusy: false, loadError: 'error' })
    expect(screen.queryAllByTestId('kpi-skeleton')).toHaveLength(0)
  })

  it('no KPI skeletons when overview is loaded', () => {
    renderTab({ overview: overview(), loadBusy: false })
    expect(screen.queryAllByTestId('kpi-skeleton')).toHaveLength(0)
  })
})

// ── Secondary metrics warn states (TS-035 – TS-038) ──────────────────────────

describe('AdminDashboardSummaryTab — secondary metrics warn', () => {
  it('vault_stale_14d=0 value has no amber warn class (TS-035)', () => {
    renderTab({ overview: overview({ vault_stale_14d: 0 }) })
    // All visible "0" value elements should NOT carry text-amber-400
    const zeroEls = screen.getAllByText('0')
    zeroEls.forEach((el) => {
      expect(el.className).not.toContain('text-amber-400')
    })
  })

  it('vault_stale_14d>0 value has amber warn class (TS-036)', () => {
    renderTab({ overview: overview({ vault_stale_14d: 42 }) })
    const el = screen.getByText('42')
    expect(el.className).toContain('text-amber-400')
  })

  it('defect_submissions_7d=0 value has no amber warn class (TS-037)', () => {
    renderTab({ overview: overview({ defect_submissions_7d: 0 }) })
    const zeroEls = screen.getAllByText('0')
    zeroEls.forEach((el) => {
      expect(el.className).not.toContain('text-amber-400')
    })
  })

  it('defect_submissions_7d>0 value has amber warn class (TS-038)', () => {
    renderTab({ overview: overview({ defect_submissions_7d: 37 }) })
    const el = screen.getByText('37')
    expect(el.className).toContain('text-amber-400')
  })
})

// ── vault stale label (TS-063 / TS-064 revised) ───────────────────────────────
// The current component calls t('admin.dashboard.kpiVaultStale') WITHOUT
// days-interpolation. stale_vault_days field from AdminOverview is not used
// in the label. This was a discrepancy vs. the original spec — tracked in QA.

describe('AdminDashboardSummaryTab — vault stale label', () => {
  it('renders vault stale label via t() without days interpolation (TS-063/064)', () => {
    renderTab({ overview: overview({ stale_vault_days: 0 }) })
    // key is called without options — no interpolation in current implementation
    const calls = mockT.mock.calls.filter(([key]) => key === 'admin.dashboard.kpiVaultStale')
    expect(calls.length).toBeGreaterThan(0)
    calls.forEach((callArgs) => expect(callArgs.at(1)).toBeUndefined())
  })

  it('vault_stale_14d value is shown regardless of stale_vault_days field', () => {
    renderTab({ overview: overview({ vault_stale_14d: 7, stale_vault_days: 0 }) })
    expect(screen.getByText('7')).toBeInTheDocument()
  })
})
