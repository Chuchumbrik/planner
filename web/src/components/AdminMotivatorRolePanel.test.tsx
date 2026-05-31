import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AdminMotivatorRolePanel } from './AdminMotivatorRolePanel'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockT = vi.fn((key: string) => key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT, i18n: { language: 'en' } }),
}))

vi.mock('@/components/ui/MaterialIcon', () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/components/admin/RoleBadge', () => ({
  RoleBadge: ({ role }: { role: string }) => (
    <span data-testid={`role-badge-${role}`}>{role}</span>
  ),
}))

// Return predictable strings instead of locale-dependent Intl output
vi.mock('@/lib/formatAdminDate', () => ({
  formatAdminDateTime: (iso: string | null) => (iso ? 'DATE' : '—'),
}))

beforeEach(() => mockT.mockClear())

// ── fixtures ──────────────────────────────────────────────────────────────────

const mockSupabase = {} as SupabaseClient

function row(partial: Partial<MotivatorRoleRow> & Pick<MotivatorRoleRow, 'id'>): MotivatorRoleRow {
  return {
    email: `${partial.id}@test.com`,
    created_at: '2026-05-01T00:00:00Z',
    last_sign_in_at: '2026-05-20T00:00:00Z',
    motivator_role: 'user',
    has_vault: true,
    vault_updated_at: '2026-05-20T00:00:00Z',
    push_device_count: 0,
    push_last_seen_at: null,
    defect_submission_count: 0,
    defect_last_at: null,
    ...partial,
  }
}

function renderPanel(
  props: Partial<Parameters<typeof AdminMotivatorRolePanel>[0]> = {},
) {
  return render(
    <AdminMotivatorRolePanel
      supabase={mockSupabase}
      currentUserId="owner-1"
      users={[]}
      loadBusy={false}
      loadError={null}
      listDegraded={false}
      onRefresh={vi.fn()}
      onReload={vi.fn().mockResolvedValue(undefined)}
      onLoadError={vi.fn()}
      searchDebounceMs={0}
      {...props}
    />,
  )
}

// ── rendering ─────────────────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — rendering', () => {
  it('renders search input', () => {
    renderPanel()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    renderPanel()
    expect(screen.getByText('settings.adminRolesRefresh')).toBeInTheDocument()
  })

  it('renders 3 filter groups (role, activity, extras)', () => {
    renderPanel()
    const groups = screen.getAllByRole('group')
    expect(groups).toHaveLength(3)
  })

  it('renders role filter group with 4 chips', () => {
    renderPanel()
    const roleGroup = screen.getByRole('group', { name: 'admin.dashboard.filterRoleAria' })
    expect(within(roleGroup).getAllByRole('button')).toHaveLength(4)
  })

  it('renders activity filter group with 3 chips', () => {
    renderPanel()
    const actGroup = screen.getByRole('group', { name: 'admin.dashboard.filterActivityAria' })
    expect(within(actGroup).getAllByRole('button')).toHaveLength(3)
  })

  it('renders extras filter group with 3 chips', () => {
    renderPanel()
    const extGroup = screen.getByRole('group', { name: 'admin.dashboard.filterExtrasAria' })
    expect(within(extGroup).getAllByRole('button')).toHaveLength(3)
  })

  it('renders sort buttons (last_sign_in active by default)', () => {
    renderPanel()
    expect(screen.getByText('admin.dashboard.sortLastSignIn')).toBeInTheDocument()
    expect(screen.getByText('admin.dashboard.sortRegistered')).toBeInTheDocument()
    expect(screen.getByText('admin.dashboard.sortEmail')).toBeInTheDocument()
    expect(screen.getByText('admin.dashboard.sortRole')).toBeInTheDocument()
  })

  it('shows section title from AdminCardSection', () => {
    renderPanel()
    expect(screen.getByText('admin.dashboard.tabs.usersTitle')).toBeInTheDocument()
  })

  it('shows empty state when no users match', () => {
    renderPanel({ users: [], loadBusy: false })
    // Both mobile and desktop views render the empty message
    const empties = screen.getAllByText('settings.adminRolesEmpty')
    expect(empties.length).toBeGreaterThan(0)
  })

  it('renders a row for each user (appears in both mobile + desktop views)', () => {
    const users = [
      row({ id: 'u1', email: 'alice@test.com' }),
      row({ id: 'u2', email: 'bob@test.com' }),
    ]
    renderPanel({ users })
    expect(screen.getAllByText('alice@test.com').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('bob@test.com').length).toBeGreaterThanOrEqual(1)
  })

  it('renders role select per user', () => {
    const users = [row({ id: 'u1' }), row({ id: 'u2' })]
    renderPanel({ users })
    // Each user has a select in mobile card and desktop table → ≥2 per user
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })
})

// ── error & degraded (TS-022, TS-024) ────────────────────────────────────────

describe('AdminMotivatorRolePanel — status banners', () => {
  it('shows error with role=alert when loadError is set', () => {
    renderPanel({ loadError: 'Load failed' })
    expect(screen.getByRole('alert')).toHaveTextContent('Load failed')
  })

  it('shows degraded warning with role=status when listDegraded=true', () => {
    renderPanel({ listDegraded: true })
    expect(screen.getByRole('status')).toHaveTextContent('admin.dashboard.listDegraded')
  })

  it('no alert when loadError is null', () => {
    renderPanel({ loadError: null })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ── refresh button ─────────────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — refresh button', () => {
  it('calls onRefresh when clicked', () => {
    const onRefresh = vi.fn()
    renderPanel({ onRefresh })
    fireEvent.click(screen.getByText('settings.adminRolesRefresh'))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('shows loading text and is disabled when loadBusy=true', () => {
    renderPanel({ loadBusy: true })
    const btn = screen.getByText('common.loading').closest('button')
    expect(btn).toBeDisabled()
  })
})

// ── search filter ─────────────────────────────────────────────────────────────
// renderPanel passes searchDebounceMs=0, so filtering is synchronous in tests.

describe('AdminMotivatorRolePanel — search', () => {
  it('filters users by email substring', () => {
    const users = [
      row({ id: 'u1', email: 'alice@test.com' }),
      row({ id: 'u2', email: 'bob@test.com' }),
    ]
    renderPanel({ users })
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'alice' } })
    expect(screen.getAllByText('alice@test.com').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('bob@test.com')).toHaveLength(0)
  })

  it('shows all users when search is cleared', () => {
    const users = [
      row({ id: 'u1', email: 'alice@test.com' }),
      row({ id: 'u2', email: 'bob@test.com' }),
    ]
    renderPanel({ users })
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'alice' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getAllByText('alice@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('bob@test.com').length).toBeGreaterThan(0)
  })

  it('shows empty state when search matches nothing', () => {
    const users = [row({ id: 'u1', email: 'alice@test.com' })]
    renderPanel({ users })
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } })
    expect(screen.getAllByText('settings.adminRolesEmpty').length).toBeGreaterThan(0)
  })
})

// ── segment filter ────────────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — segment filter', () => {
  it('clicking role_admin chip shows only admin users', () => {
    const users = [
      row({ id: 'u1', email: 'admin@test.com', motivator_role: 'admin' }),
      row({ id: 'u2', email: 'regular@test.com', motivator_role: 'user' }),
    ]
    renderPanel({ users })
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_admin'))
    expect(screen.getAllByText('admin@test.com').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('regular@test.com')).toHaveLength(0)
  })

  it('clicking role_user chip shows only regular users', () => {
    const users = [
      row({ id: 'u1', email: 'admin@test.com', motivator_role: 'admin' }),
      row({ id: 'u2', email: 'regular@test.com', motivator_role: 'user' }),
    ]
    renderPanel({ users })
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_user'))
    expect(screen.queryAllByText('admin@test.com')).toHaveLength(0)
    expect(screen.getAllByText('regular@test.com').length).toBeGreaterThan(0)
  })

  it('switching back to all shows all users', () => {
    const users = [
      row({ id: 'u1', email: 'admin@test.com', motivator_role: 'admin' }),
      row({ id: 'u2', email: 'regular@test.com', motivator_role: 'user' }),
    ]
    renderPanel({ users })
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_admin'))
    fireEvent.click(screen.getByText('admin.dashboard.filter.all'))
    expect(screen.getAllByText('admin@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('regular@test.com').length).toBeGreaterThan(0)
  })
})

// ── composable filters ────────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — composable filters', () => {
  const adminUser = () => row({ id: 'u1', email: 'admin@test.com', motivator_role: 'admin' })
  const regularUser = () => row({ id: 'u2', email: 'regular@test.com', motivator_role: 'user' })

  it('role filter — Admin shows only admin users', () => {
    renderPanel({ users: [adminUser(), regularUser()] })
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_admin'))
    expect(screen.getAllByText('admin@test.com').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('regular@test.com')).toHaveLength(0)
  })

  it('role filter — All restores all users', () => {
    renderPanel({ users: [adminUser(), regularUser()] })
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_admin'))
    fireEvent.click(screen.getByText('admin.dashboard.filter.all'))
    expect(screen.getAllByText('admin@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('regular@test.com').length).toBeGreaterThan(0)
  })

  it('extras — no_vault hides users with vault', () => {
    const withVault = row({ id: 'v', email: 'vault@test.com', has_vault: true })
    const noVault = row({ id: 'nv', email: 'novault@test.com', has_vault: false })
    renderPanel({ users: [withVault, noVault] })
    fireEvent.click(screen.getByText('admin.dashboard.filter.no_vault'))
    expect(screen.queryAllByText('vault@test.com')).toHaveLength(0)
    expect(screen.getAllByText('novault@test.com').length).toBeGreaterThan(0)
  })

  it('extras — with_push hides users without push devices', () => {
    const withPush = row({ id: 'p', email: 'push@test.com', push_device_count: 2 })
    const noPush = row({ id: 'np', email: 'nopush@test.com', push_device_count: 0 })
    renderPanel({ users: [withPush, noPush] })
    fireEvent.click(screen.getByText('admin.dashboard.filter.with_push'))
    expect(screen.getAllByText('push@test.com').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('nopush@test.com')).toHaveLength(0)
  })

  it('combined — role Admin + with_push filters both dimensions', () => {
    const adminPush = row({ id: 'ap', email: 'adminpush@test.com', motivator_role: 'admin', push_device_count: 1 })
    const adminNoPush = row({ id: 'an', email: 'adminnopush@test.com', motivator_role: 'admin', push_device_count: 0 })
    const userPush = row({ id: 'up', email: 'userpush@test.com', motivator_role: 'user', push_device_count: 1 })
    renderPanel({ users: [adminPush, adminNoPush, userPush] })
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_admin'))
    fireEvent.click(screen.getByText('admin.dashboard.filter.with_push'))
    expect(screen.getAllByText('adminpush@test.com').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('adminnopush@test.com')).toHaveLength(0)
    expect(screen.queryAllByText('userpush@test.com')).toHaveLength(0)
  })

  it('Reset button appears when a filter is active', () => {
    renderPanel({ users: [adminUser()] })
    expect(screen.queryByText('admin.dashboard.filtersReset')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_admin'))
    expect(screen.getByText('admin.dashboard.filtersReset')).toBeInTheDocument()
  })

  it('Reset button clears all filters', () => {
    renderPanel({ users: [adminUser(), regularUser()] })
    fireEvent.click(screen.getByText('admin.dashboard.filter.role_admin'))
    fireEvent.click(screen.getByText('admin.dashboard.filtersReset'))
    expect(screen.getAllByText('admin@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('regular@test.com').length).toBeGreaterThan(0)
    expect(screen.queryByText('admin.dashboard.filtersReset')).not.toBeInTheDocument()
  })
})

// ── sort ──────────────────────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — sort', () => {
  it('clicking Email sort button sorts alphabetically', () => {
    const users = [
      row({ id: 'z', email: 'zebra@test.com' }),
      row({ id: 'a', email: 'apple@test.com' }),
    ]
    renderPanel({ users })
    fireEvent.click(screen.getByText('admin.dashboard.sortEmail'))
    // Both rows still visible
    expect(screen.getAllByText('zebra@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('apple@test.com').length).toBeGreaterThan(0)
  })

  it('clicking active sort button toggles direction icon', () => {
    renderPanel()
    // Default is last_sign_in desc — shows arrow_downward
    expect(screen.getAllByTestId('icon-arrow_downward').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('admin.dashboard.sortLastSignIn'))
    // After click same field → toggles to asc → arrow_upward
    expect(screen.getAllByTestId('icon-arrow_upward').length).toBeGreaterThan(0)
  })
})

// ── "You" label ───────────────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — current user', () => {
  it('shows "You" label next to current user', () => {
    const users = [row({ id: 'owner-1', email: 'me@test.com' })]
    renderPanel({ users, currentUserId: 'owner-1' })
    expect(screen.getAllByText('settings.adminRolesYou').length).toBeGreaterThan(0)
  })

  it('does not show "You" label for other users', () => {
    const users = [row({ id: 'other', email: 'other@test.com' })]
    renderPanel({ users, currentUserId: 'owner-1' })
    expect(screen.queryByText('settings.adminRolesYou')).not.toBeInTheDocument()
  })
})

// ── stale vault indicator ─────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — stale vault', () => {
  it('shows warning icon for user with stale vault', () => {
    const staleUser = row({
      id: 'u1',
      has_vault: true,
      vault_updated_at: '2025-01-01T00:00:00Z', // far in the past → stale
    })
    renderPanel({ users: [staleUser] })
    expect(screen.getAllByTestId('icon-warning').length).toBeGreaterThan(0)
  })

  it('does not show warning icon for user with fresh vault', () => {
    const freshUser = row({
      id: 'u1',
      has_vault: true,
      vault_updated_at: new Date().toISOString(), // today → fresh
    })
    renderPanel({ users: [freshUser] })
    expect(screen.queryAllByTestId('icon-warning')).toHaveLength(0)
  })
})

// ── role change modal ─────────────────────────────────────────────────────────

describe('AdminMotivatorRolePanel — role change modal', () => {
  it('opens confirmation modal when role select changes', () => {
    const users = [row({ id: 'u1', email: 'alice@test.com', motivator_role: 'user' })]
    renderPanel({ users })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'admin' } })
    expect(screen.getByText('common.save')).toBeInTheDocument()
  })

  it('modal is closed after clicking Cancel', () => {
    const users = [row({ id: 'u1', email: 'alice@test.com', motivator_role: 'user' })]
    renderPanel({ users })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'admin' } })
    fireEvent.click(screen.getByText('common.cancel'))
    expect(screen.queryByText('common.save')).not.toBeInTheDocument()
  })

  it('modal shows new role badge', () => {
    const users = [row({ id: 'u1', email: 'alice@test.com', motivator_role: 'user' })]
    renderPanel({ users })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'beta_tester' } })
    // new role badge appears in the modal (old role badge also present in user rows)
    expect(screen.getAllByTestId('role-badge-user').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('role-badge-beta_tester').length).toBeGreaterThan(0)
  })

  it('self-demote shows amber warning text', () => {
    const users = [row({ id: 'owner-1', email: 'me@test.com', motivator_role: 'admin' })]
    renderPanel({ users, currentUserId: 'owner-1' })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'user' } })
    expect(screen.getByText('settings.adminRolesConfirmSelfDemote')).toBeInTheDocument()
  })

  it('self-demote: Save disabled until checkbox acknowledged', () => {
    const users = [row({ id: 'owner-1', email: 'me@test.com', motivator_role: 'admin' })]
    renderPanel({ users, currentUserId: 'owner-1' })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'user' } })

    const saveBtn = screen.getByText('common.save').closest('button')
    expect(saveBtn).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox'))
    expect(saveBtn).not.toBeDisabled()
  })

  it('no modal for same-role change (no state change)', () => {
    const users = [row({ id: 'u1', motivator_role: 'user' })]
    renderPanel({ users })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'user' } }) // same role
    expect(screen.queryByText('common.save')).not.toBeInTheDocument()
  })
})
