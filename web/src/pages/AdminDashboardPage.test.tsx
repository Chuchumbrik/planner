import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminDashboardPage } from './AdminDashboardPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// mutable so individual tests can override
let _supabase: any = {}
vi.mock('@/lib/supabase', () => ({
  get supabase() { return _supabase },
  isSupabaseConfigured: true,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="shell" data-title={title}>{children}</div>
  ),
}))

vi.mock('@/components/admin/AdminDashboardTabLayout', () => ({
  AdminDashboardTabLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tab-layout">{children}</div>
  ),
}))

vi.mock('@/components/admin/AdminDashboardSummaryTab', () => ({
  AdminDashboardSummaryTab: () => <div data-testid="summary-tab" />,
}))

vi.mock('@/components/AdminMotivatorRolePanel', () => ({
  AdminMotivatorRolePanel: () => <div data-testid="role-panel" />,
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: () => null,
}))

vi.mock('@/components/admin/useAdminDashboardTab', () => ({
  useAdminDashboardTab: vi.fn(),
}))

vi.mock('@/components/admin/useAdminMotivatorUsers', () => ({
  useAdminMotivatorUsers: vi.fn(),
}))

vi.mock('@/components/admin/useAdminOverview', () => ({
  useAdminOverview: vi.fn(),
}))

import { useAuth } from '@/auth/AuthProvider'
import { useAdminDashboardTab } from '@/components/admin/useAdminDashboardTab'
import { useAdminMotivatorUsers } from '@/components/admin/useAdminMotivatorUsers'
import { useAdminOverview } from '@/components/admin/useAdminOverview'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/app" element={<div data-testid="app-page" />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  _supabase = {}
  vi.mocked(useAuth).mockReturnValue({ session: { user: { id: 'user-1' } } } as any)
  vi.mocked(useAdminDashboardTab).mockReturnValue(['summary', vi.fn()] as any)
  vi.mocked(useAdminMotivatorUsers).mockReturnValue({
    users: [], loadBusy: false, loadError: null, listDegraded: false,
    load: vi.fn(), setLoadError: vi.fn(),
  } as any)
  vi.mocked(useAdminOverview).mockReturnValue({
    overview: null, loadBusy: false, loadError: null, listDegraded: false,
    load: vi.fn(), lastLoaded: null,
  } as any)
})

describe('AdminDashboardPage — guards', () => {
  it('redirects to /app when supabase is not configured', () => {
    _supabase = null
    renderPage()
    expect(screen.getByTestId('app-page')).toBeInTheDocument()
  })

  it('redirects to /login when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null } as any)
    renderPage()
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })
})

describe('AdminDashboardPage — rendering', () => {
  it('renders shell wrapper when authenticated', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })

  it('renders tab layout', () => {
    renderPage()
    expect(screen.getByTestId('tab-layout')).toBeInTheDocument()
  })

  it('shows summary tab when activeTab is summary', () => {
    vi.mocked(useAdminDashboardTab).mockReturnValue(['summary', vi.fn()] as any)
    renderPage()
    expect(screen.getByTestId('summary-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('role-panel')).not.toBeInTheDocument()
  })

  it('shows role panel when activeTab is users', () => {
    vi.mocked(useAdminDashboardTab).mockReturnValue(['users', vi.fn()] as any)
    renderPage()
    expect(screen.getByTestId('role-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('summary-tab')).not.toBeInTheDocument()
  })
})
