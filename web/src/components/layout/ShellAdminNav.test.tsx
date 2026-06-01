import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShellAdminNav } from './ShellAdminNav'

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockT = vi.fn((key: string) => key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

beforeEach(() => mockT.mockClear())

// ── helper ────────────────────────────────────────────────────────────────────

function renderNav(
  props: Partial<Parameters<typeof ShellAdminNav>[0]> = {},
  initialPath = '/admin/dashboard',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ShellAdminNav isAdmin={true} {...props} />
    </MemoryRouter>,
  )
}

// ── nav items by role ─────────────────────────────────────────────────────────

describe('ShellAdminNav — items by role', () => {
  it('admin sees back-to-app link + 4 admin nav links', () => {
    renderNav({ isAdmin: true })
    const links = screen.getAllByRole('link')
    // back to /app + dashboard + roadmap + discussions + testing = 5
    expect(links).toHaveLength(5)
  })

  it('non-admin (beta_tester) sees back-to-app link + 3 nav links', () => {
    renderNav({ isAdmin: false })
    const links = screen.getAllByRole('link')
    // back to /app + roadmap + discussions + testing = 4 (no dashboard)
    expect(links).toHaveLength(4)
  })

  it('admin: dashboard link present', () => {
    renderNav({ isAdmin: true })
    const dashboardLink = screen.getByText('shell.adminNavDashboard').closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard')
  })

  it('non-admin: no dashboard link', () => {
    renderNav({ isAdmin: false })
    expect(screen.queryByText('shell.adminNavDashboard')).not.toBeInTheDocument()
  })

  it('non-admin: roadmap link present', () => {
    renderNav({ isAdmin: false })
    const link = screen.getByText('shell.adminNavRoadmap').closest('a')
    expect(link).toHaveAttribute('href', '/admin/roadmap')
  })

  it('non-admin: testing link present', () => {
    renderNav({ isAdmin: false })
    const link = screen.getByText('shell.adminNavTesting').closest('a')
    expect(link).toHaveAttribute('href', '/admin/testing')
  })
})

// ── back-to-app link ──────────────────────────────────────────────────────────

describe('ShellAdminNav — back-to-app link', () => {
  it('back-to-app link points to /app', () => {
    renderNav()
    const links = screen.getAllByRole('link')
    const backLink = links.find((l) => l.getAttribute('href') === '/app')
    expect(backLink).toBeInTheDocument()
  })

  it('back-to-app label is rendered', () => {
    renderNav()
    expect(screen.getByText('shell.adminBackToApp')).toBeInTheDocument()
  })
})

// ── section label ─────────────────────────────────────────────────────────────

describe('ShellAdminNav — section label', () => {
  it('shows section label when not collapsed', () => {
    renderNav({ collapsed: false })
    expect(screen.getByText('shell.adminNavSection')).toBeInTheDocument()
  })

  it('hides section label when collapsed', () => {
    renderNav({ collapsed: true })
    expect(screen.queryByText('shell.adminNavSection')).not.toBeInTheDocument()
  })
})

// ── collapsed mode (sr-only labels) ──────────────────────────────────────────

describe('ShellAdminNav — collapsed mode', () => {
  it('nav link labels have sr-only class when collapsed', () => {
    renderNav({ collapsed: true, isAdmin: true })
    // Dashboard label span should have sr-only class
    const dashboardLabel = screen.getByText('shell.adminNavDashboard')
    expect(dashboardLabel.className).toContain('sr-only')
  })

  it('nav link labels visible (no sr-only) when not collapsed', () => {
    renderNav({ collapsed: false, isAdmin: true })
    const dashboardLabel = screen.getByText('shell.adminNavDashboard')
    expect(dashboardLabel.className).not.toContain('sr-only')
  })

  it('collapsed links have aria-label for accessibility', () => {
    renderNav({ collapsed: true, isAdmin: true })
    // dashboard link should have aria-label when collapsed
    const links = screen.getAllByRole('link')
    const dashboardLink = links.find((l) => l.getAttribute('href') === '/admin/dashboard')
    expect(dashboardLink?.getAttribute('aria-label')).toBe('shell.adminNavDashboard')
  })

  it('non-collapsed links have no aria-label (text is visible)', () => {
    renderNav({ collapsed: false, isAdmin: true })
    const links = screen.getAllByRole('link')
    const dashboardLink = links.find((l) => l.getAttribute('href') === '/admin/dashboard')
    expect(dashboardLink?.getAttribute('aria-label')).toBeNull()
  })
})

// ── active state based on route ───────────────────────────────────────────────

describe('ShellAdminNav — active state', () => {
  it('calls onNavigate when a link is clicked', () => {
    const onNavigate = vi.fn()
    renderNav({ onNavigate, isAdmin: true }, '/admin/roadmap')
    const roadmapLink = screen.getByText('shell.adminNavRoadmap').closest('a')!
    roadmapLink.click()
    expect(onNavigate).toHaveBeenCalledOnce()
  })
})
