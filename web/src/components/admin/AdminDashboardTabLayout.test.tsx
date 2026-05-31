import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminDashboardTabLayout } from './AdminDashboardTabLayout'

const mockT = vi.fn((key: string) => key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

beforeEach(() => mockT.mockClear())

// ── Tab switching (TS-006, TS-007) ────────────────────────────────────────────

describe('AdminDashboardTabLayout — tab switching', () => {
  it('clicking users tab calls onTabChange("users") (TS-006)', () => {
    const onTabChange = vi.fn()
    render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={onTabChange}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    fireEvent.click(screen.getByText('admin.dashboard.tabs.users'))
    expect(onTabChange).toHaveBeenCalledWith('users')
  })

  it('clicking summary tab calls onTabChange("summary") (TS-007)', () => {
    const onTabChange = vi.fn()
    render(
      <AdminDashboardTabLayout activeTab="users" onTabChange={onTabChange}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    fireEvent.click(screen.getByText('admin.dashboard.tabs.summary'))
    expect(onTabChange).toHaveBeenCalledWith('summary')
  })

  it('active tab has aria-selected=true', () => {
    render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    const btn = screen.getByText('admin.dashboard.tabs.summary').closest('button')
    expect(btn?.getAttribute('aria-selected')).toBe('true')
  })

  it('inactive tab has aria-selected=false', () => {
    render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    const btn = screen.getByText('admin.dashboard.tabs.users').closest('button')
    expect(btn?.getAttribute('aria-selected')).toBe('false')
  })

  it('renders children inside tab panel', () => {
    render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div data-testid="panel-content">hello</div>
      </AdminDashboardTabLayout>,
    )
    expect(screen.getByTestId('panel-content')).toBeInTheDocument()
  })

  it('renders headerActions when provided', () => {
    render(
      <AdminDashboardTabLayout
        activeTab="summary"
        onTabChange={vi.fn()}
        headerActions={<button>Refresh</button>}
      >
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })
})

// ── ARIA markup (TS-061) ──────────────────────────────────────────────────────

describe('AdminDashboardTabLayout — ARIA markup (TS-061)', () => {
  it('nav has role=tablist', () => {
    const { container } = render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    expect(container.querySelector('nav')?.getAttribute('role')).toBe('tablist')
  })

  it('renders exactly 2 tab buttons with role=tab', () => {
    render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('tab panel has role=tabpanel', () => {
    const { container } = render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    expect(container.querySelector('[role="tabpanel"]')).not.toBeNull()
  })

  it('summary tab button has aria-controls=admin-panel-summary', () => {
    render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    const tabs = screen.getAllByRole('tab')
    const summaryTab = tabs.find((t) => t.getAttribute('id') === 'admin-tab-summary')
    expect(summaryTab?.getAttribute('aria-controls')).toBe('admin-panel-summary')
  })

  it('tab panel id matches active tab aria-controls', () => {
    const { container } = render(
      <AdminDashboardTabLayout activeTab="summary" onTabChange={vi.fn()}>
        <div>content</div>
      </AdminDashboardTabLayout>,
    )
    const panel = container.querySelector('[role="tabpanel"]')
    expect(panel?.getAttribute('id')).toBe('admin-panel-summary')
    expect(panel?.getAttribute('aria-labelledby')).toBe('admin-tab-summary')
  })
})
