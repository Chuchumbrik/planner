import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { formatAdminDateTime } from '@/lib/formatAdminDate'
import {
  buildUserComparator,
  isInactiveForDays,
  isVaultStale,
  type UserSortField,
} from '@/components/admin/adminDashboardMetrics'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { AdminCardSection } from '@/components/admin/AdminCardSection'
import { AdminConfirmRoleModal, type PendingRoleChange } from '@/components/admin/AdminConfirmRoleModal'
import { UserMobileCard, UserDesktopRow } from '@/components/admin/AdminUserListRow'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import { ADMIN_ROLES_FN, STALE_VAULT_DAYS } from '@/lib/adminMonitoringConstants'
import {
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
  chipActive,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

export type { MotivatorRoleRow } from '@/types/adminMonitoring'

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    if (delayMs === 0) return
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return delayMs === 0 ? value : debounced
}

type RoleFilter = 'all' | 'admin' | 'beta_tester' | 'user'
type ActivityFilter = 'all' | 'inactive7' | 'inactive30'
type ExtraFilter = 'no_vault' | 'vault_stale' | 'with_push'

// ── main component ────────────────────────────────────────────────────────────

export function AdminMotivatorRolePanel({
  supabase,
  currentUserId,
  users,
  loadBusy,
  loadError,
  listDegraded,
  degradedTables = [],
  onRefresh,
  onReload,
  onLoadError,
  searchDebounceMs = 300,
}: {
  supabase: SupabaseClient
  currentUserId: string | undefined
  users: MotivatorRoleRow[]
  loadBusy: boolean
  loadError: string | null
  listDegraded?: boolean
  degradedTables?: string[]
  onRefresh: () => void
  onReload: () => Promise<void>
  onLoadError: (message: string | null) => void
  searchDebounceMs?: number
}) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, searchDebounceMs)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')
  const [extraFilters, setExtraFilters] = useState<Set<ExtraFilter>>(new Set())
  const [sortField, setSortField] = useState<UserSortField>('last_sign_in')
  const PAGE_SIZE = 200
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [rowBusyId, setRowBusyId] = useState<string | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  function toggleExtra(key: ExtraFilter) {
    setExtraFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleSortField(field: UserSortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function resetFilters() {
    setSearch('')
    setRoleFilter('all')
    setActivityFilter('all')
    setExtraFilters(new Set())
    setSortField('last_sign_in')
    setSortDir('desc')
    setVisibleCount(PAGE_SIZE)
  }

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    roleFilter !== 'all' ||
    activityFilter !== 'all' ||
    extraFilters.size > 0

  // mounted guard — prevents setState on unmounted component if the user
  // navigates away mid-request. The Edge Function still completes server-side.
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return users
      .filter((u) => {
        if (q && !u.email.toLowerCase().includes(q) && !u.id.toLowerCase().includes(q)) return false
        if (roleFilter !== 'all' && u.motivator_role !== roleFilter) return false
        if (activityFilter === 'inactive7' && !isInactiveForDays(u, 7)) return false
        if (activityFilter === 'inactive30' && !isInactiveForDays(u, 30)) return false
        if (extraFilters.has('no_vault') && u.has_vault) return false
        if (extraFilters.has('vault_stale') && !isVaultStale(u)) return false
        if (extraFilters.has('with_push') && u.push_device_count === 0) return false
        return true
      })
      .sort(buildUserComparator(sortField, sortDir))
  }, [users, debouncedSearch, roleFilter, activityFilter, extraFilters, sortField, sortDir])

  const visibleUsers = filtered.slice(0, visibleCount)
  const hiddenCount = filtered.length - visibleUsers.length

  async function applyRole(user: MotivatorRoleRow, role: MotivatorRoleRow['motivator_role']) {
    if (role === user.motivator_role) return
    onLoadError(null)
    setRowBusyId(user.id)
    const userId = user.id
    const ctrl = new AbortController()
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'setRole', userId, role, expectedRole: user.motivator_role },
        signal: ctrl.signal,
      })
      if (!mountedRef.current) return
      if (fnErr) {
        await onReload()
        if (!mountedRef.current) return
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        onLoadError(mapAdminRolesError(msg, t))
        return
      }
      if (!data || typeof data !== 'object' || !('ok' in data) || !(data as { ok?: unknown }).ok) {
        await onReload()
        if (!mountedRef.current) return
        onLoadError(t('settings.adminRolesErrors.update_failed'))
        return
      }
      await onReload()
      if (!mountedRef.current) return
      if (userId === currentUserId) {
        await supabase.auth.refreshSession()
      }
    } catch (e: unknown) {
      if (!mountedRef.current) return
      await onReload()
      if (!mountedRef.current) return
      onLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
    } finally {
      if (mountedRef.current) {
        setRowBusyId(null)
        setPendingChange(null)
      }
    }
  }

  function requestRoleChange(user: MotivatorRoleRow, newRole: MotivatorRoleRow['motivator_role']) {
    if (newRole === user.motivator_role) return
    setPendingChange({ user, newRole })
  }

  function confirmChange() {
    if (!pendingChange) return
    void applyRole(pendingChange.user, pendingChange.newRole)
  }

  function cancelChange() {
    if (rowBusyId) return
    setPendingChange(null)
  }

  function formatDate(iso: string | null) {
    return formatAdminDateTime(iso, i18n.language)
  }

  function exportCsv() {
    const header = ['email', 'id', 'role', 'created_at', 'last_sign_in_at', 'has_vault', 'vault_updated_at', 'push_devices', 'defects']
    const rows = filtered.map((u) => [
      u.email,
      u.id,
      u.motivator_role,
      u.created_at || '',
      u.last_sign_in_at || '',
      u.has_vault ? '1' : '0',
      u.vault_updated_at || '',
      String(u.push_device_count),
      String(u.defect_submission_count),
    ])
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const modalBusy = pendingChange ? rowBusyId === pendingChange.user.id : false

  const refreshButton = (
    <button
      type="button"
      disabled={loadBusy}
      className={`${SETTINGS_BTN_SECONDARY} shrink-0`}
      onClick={onRefresh}
    >
      {loadBusy ? t('common.loading') : t('settings.adminRolesRefresh')}
    </button>
  )

  return (
    // Page wrapper applies the shared cascade fade-in to every top-level
    // block on the Users tab — same pattern the Summary tab uses, so the
    // two tabs feel consistent.
    <div className="admin-summary-stagger">
      <AdminCardSection
        title={t('admin.dashboard.tabs.usersTitle')}
        titleTooltip={t('admin.dashboard.usersMetricsHint', { days: STALE_VAULT_DAYS })}
        action={refreshButton}
        collapsible
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      >
        {/* Search */}
        <input
          type="search"
          autoComplete="off"
          placeholder={t('settings.adminRolesSearchPlaceholder')}
          className={`${MOTIVATOR_INPUT} min-w-0 w-full placeholder:text-on-surface-variant`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-sm">
        {/* ── Filter rows ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">

          {/* Role */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('admin.dashboard.filterRoleAria')}>
            <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">
              {t('admin.dashboard.filterRoleLabel')}
            </span>
            {(['all', 'admin', 'beta_tester', 'user'] as RoleFilter[]).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={roleFilter === r}
                className={cn(chipActive(roleFilter === r), 'text-label-sm')}
                onClick={() => setRoleFilter(r)}
              >
                {r === 'all'
                  ? t('admin.dashboard.filter.all')
                  : t(`admin.dashboard.filter.role_${r === 'beta_tester' ? 'beta' : r}`)}
              </button>
            ))}
          </div>

          {/* Activity */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('admin.dashboard.filterActivityAria')}>
            <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">
              {t('admin.dashboard.filterActivityLabel')}
            </span>
            {(['all', 'inactive7', 'inactive30'] as ActivityFilter[]).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={activityFilter === a}
                className={cn(chipActive(activityFilter === a), 'text-label-sm')}
                onClick={() => setActivityFilter(a)}
              >
                {a === 'all'
                  ? t('admin.dashboard.filterActivityAll')
                  : t(`admin.dashboard.filter.${a}`)}
              </button>
            ))}
          </div>

          {/* Extras (multi-select) */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('admin.dashboard.filterExtrasAria')}>
            <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">
              {t('admin.dashboard.filterExtrasLabel')}
            </span>
            {([
              ['no_vault', t('admin.dashboard.filter.no_vault')],
              ['vault_stale', t('admin.dashboard.filter.vault_stale_14d', { days: STALE_VAULT_DAYS })],
              ['with_push', t('admin.dashboard.filter.with_push')],
            ] as [ExtraFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={extraFilters.has(key)}
                className={cn(chipActive(extraFilters.has(key)), 'text-label-sm')}
                onClick={() => toggleExtra(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">
              {t('admin.dashboard.sortLabel')}
            </span>
            {([
              ['last_sign_in', t('admin.dashboard.sortLastSignIn')],
              ['created', t('admin.dashboard.sortRegistered')],
              ['email', t('admin.dashboard.sortEmail')],
              ['role', t('admin.dashboard.sortRole')],
            ] as [UserSortField, string][]).map(([field, label]) => (
              <button
                key={field}
                type="button"
                aria-pressed={sortField === field}
                className={cn(chipActive(sortField === field), 'inline-flex items-center gap-1 text-label-sm')}
                onClick={() => handleSortField(field)}
              >
                {label}
                {sortField === field ? (
                  <MaterialIcon
                    name={sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                    size={12}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Count + Reset + Export */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-on-surface-variant">
            {t('admin.dashboard.usersCount', { count: filtered.length })}
          </span>
          <div className="flex items-center gap-2">
            {filtered.length > 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-on-surface-variant transition-colors hover:text-on-surface"
                onClick={exportCsv}
                title={t('admin.dashboard.exportCsvTitle')}
              >
                <MaterialIcon name="download" size={12} />
                {t('admin.dashboard.exportCsv')}
              </button>
            ) : null}
            {hasActiveFilters ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-on-surface-variant transition-colors hover:text-on-surface"
                onClick={resetFilters}
              >
                <MaterialIcon name="close" size={12} />
                {t('admin.dashboard.filtersReset')}
              </button>
            ) : null}
          </div>
        </div>

        {loadError ? (
          <p className="text-xs text-red-400" role="alert">{loadError}</p>
        ) : null}
        {listDegraded ? (
          <p className="text-xs text-amber-400/90" role="status">
            {t('admin.dashboard.listDegraded')}
            {degradedTables.length > 0 ? (
              <span className="ml-1 font-mono opacity-70">({degradedTables.join(', ')})</span>
            ) : null}
          </p>
        ) : null}

        <p className="text-xs text-on-surface-variant/70">
          {t('settings.adminRolesSelfHint')}
        </p>

        {/* Mobile cards */}
        <div className="flex flex-col gap-sm md:hidden">
          {filtered.length === 0 && !loadBusy ? (
            <p className="rounded-xl border border-surface-variant px-3 py-6 text-center text-xs text-on-surface-variant">
              {t('settings.adminRolesEmpty')}
            </p>
          ) : null}
          {visibleUsers.map((u) => (
            <UserMobileCard
              key={u.id}
              user={u}
              currentUserId={currentUserId}
              busy={rowBusyId === u.id}
              loadBusy={loadBusy}
              formatDate={formatDate}
              onRoleChange={requestRoleChange}
            />
          ))}
          {hiddenCount > 0 ? (
            <button
              type="button"
              className="rounded-xl border border-surface-variant px-3 py-3 text-center text-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              {t('admin.dashboard.showMore', { count: hiddenCount })}
            </button>
          ) : null}
        </div>

        {/* Desktop table */}
        <div className="motivator-card hidden overflow-x-auto p-0 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low">
                {[
                  t('settings.adminRolesColEmail'),
                  t('admin.dashboard.colRegistered'),
                  t('admin.dashboard.colLastSignIn'),
                  t('admin.dashboard.colVault'),
                  t('admin.dashboard.colPush'),
                  t('admin.dashboard.colDefects'),
                  t('settings.adminRolesColRole'),
                ].map((label) => (
                  <th key={label} className="px-2.5 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loadBusy ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-xs text-on-surface-variant">
                    {t('settings.adminRolesEmpty')}
                  </td>
                </tr>
              ) : null}
              {visibleUsers.map((u) => (
                <UserDesktopRow
                  key={u.id}
                  user={u}
                  currentUserId={currentUserId}
                  busy={rowBusyId === u.id}
                  loadBusy={loadBusy}
                  formatDate={formatDate}
                  onRoleChange={requestRoleChange}
                />
              ))}
              {hiddenCount > 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-center">
                    <button
                      type="button"
                      className="text-xs text-on-surface-variant transition-colors hover:text-on-surface"
                      onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    >
                      {t('admin.dashboard.showMore', { count: hiddenCount })}
                    </button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        </div>
      </AdminCardSection>

      {pendingChange ? (
        <AdminConfirmRoleModal
          pending={pendingChange}
          currentUserId={currentUserId}
          busy={modalBusy}
          onConfirm={confirmChange}
          onCancel={cancelChange}
        />
      ) : null}
    </div>
  )
}
