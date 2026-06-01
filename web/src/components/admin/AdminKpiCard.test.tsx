import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AdminKpiCard } from './AdminKpiCard'

// ── i18n mock ─────────────────────────────────────────────────────────────────
// vi.fn() at module scope is accessible inside vi.mock() factory (Vitest hoisting)

const mockT = vi.fn((key: string, _opts?: unknown) => key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/components/admin/InfoTooltip', () => ({
  InfoTooltip: ({ text }: { text: string }) => <span data-testid="tooltip">{text}</span>,
}))

beforeEach(() => mockT.mockClear())

// ── helpers ───────────────────────────────────────────────────────────────────

function renderCard(props: Partial<Parameters<typeof AdminKpiCard>[0]> = {}) {
  return render(
    <AdminKpiCard
      icon="group"
      labelKey="admin.dashboard.kpiTotal"
      value="250"
      {...props}
    />,
  )
}

// ── rendering ─────────────────────────────────────────────────────────────────

describe('AdminKpiCard — rendering', () => {
  it('displays the translated label and value', () => {
    renderCard()
    expect(screen.getByText('admin.dashboard.kpiTotal')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('shows skeleton and hides value when loading=true', () => {
    renderCard({ loading: true })
    expect(screen.queryByText('250')).not.toBeInTheDocument()
    expect(document.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('renders tooltip when provided', () => {
    renderCard({ tooltip: 'Hint text' })
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
  })

  it('does not render tooltip when omitted', () => {
    renderCard()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })
})

// ── a11y: non-interactive card ────────────────────────────────────────────────

describe('AdminKpiCard — non-interactive (no trendMetric)', () => {
  it('has no role=button when trendMetric is not set', () => {
    renderCard()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('has no tabIndex when trendMetric is not set', () => {
    const { container } = renderCard()
    expect(container.querySelector('article')?.getAttribute('tabindex')).toBeNull()
  })
})

// ── a11y: interactive card (TS-060, TS-008) ───────────────────────────────────

describe('AdminKpiCard — interactive (with trendMetric)', () => {
  it('has role=button when trendMetric is set', () => {
    const { container } = renderCard({ trendMetric: 'total_users' })
    expect(container.querySelector('article')?.getAttribute('role')).toBe('button')
  })

  it('has tabIndex=0 when trendMetric is set', () => {
    const { container } = renderCard({ trendMetric: 'total_users' })
    expect(container.querySelector('article')?.getAttribute('tabindex')).toBe('0')
  })

  it('aria-pressed=false when inactive', () => {
    const { container } = renderCard({ trendMetric: 'total_users', isActive: false })
    expect(container.querySelector('article')?.getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed=true when active (TS-008)', () => {
    const { container } = renderCard({ trendMetric: 'total_users', isActive: true })
    expect(container.querySelector('article')?.getAttribute('aria-pressed')).toBe('true')
  })
})

// ── click interaction ─────────────────────────────────────────────────────────

describe('AdminKpiCard — click', () => {
  it('calls onActivate on click when trendMetric is set', () => {
    const onActivate = vi.fn()
    const { container } = renderCard({ trendMetric: 'total_users', onActivate })
    fireEvent.click(container.querySelector('article')!)
    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('does not call onActivate when trendMetric is not set', () => {
    const onActivate = vi.fn()
    const { container } = renderCard({ onActivate })
    fireEvent.click(container.querySelector('article')!)
    expect(onActivate).not.toHaveBeenCalled()
  })
})

// ── keyboard (TS-058, TS-059) ─────────────────────────────────────────────────

describe('AdminKpiCard — keyboard', () => {
  it('calls onActivate on Enter key (TS-058)', async () => {
    const onActivate = vi.fn()
    const { container } = renderCard({ trendMetric: 'total_users', onActivate })
    const article = container.querySelector('article')!
    article.focus()
    await userEvent.keyboard('{Enter}')
    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('calls onActivate on Space key (TS-059)', async () => {
    const onActivate = vi.fn()
    const { container } = renderCard({ trendMetric: 'total_users', onActivate })
    const article = container.querySelector('article')!
    article.focus()
    await userEvent.keyboard(' ')
    expect(onActivate).toHaveBeenCalledOnce()
  })
})

// TS-063 / TS-064 — stale_vault_days label interpolation lives in StatItem
// (AdminDashboardSummaryTab), NOT in AdminKpiCard. Those tests belong in
// AdminDashboardSummaryTab.test.tsx once the tab-level test suite is added.
