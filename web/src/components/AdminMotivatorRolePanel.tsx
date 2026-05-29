import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { formatAdminDateTime } from '@/lib/formatAdminDate'
import {
  type AdminUsersSegmentFilter,
  compareUsersByLastSignIn,
  isVaultStale,
  userMatchesSegment,
} from '@/components/admin/adminDashboardMetrics'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { RoleBadge } from '@/components/admin/RoleBadge'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import { ADMIN_ROLES_FN, STALE_VAULT_DAYS } from '@/lib/adminMonitoringConstants'
import {
  MODAL_CLOSE_BTN,
  MODAL_FOOTER,
  MODAL_HEADER,
  MODAL_OVERLAY,
  MODAL_SHELL,
  MODAL_TITLE,
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
  SETTINGS_CARD,
  SETTINGS_SUBHEAD,
  chipActive,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

export type { MotivatorRoleRow } from '@/types/adminMonitoring'

const SEGMENT_FILTERS: AdminUsersSegmentFilter[] = [
  'all',
  'inactive7',
  'inactive30',
  'no_vault',
  'vault_stale_14d',
  'with_push',
  'role_admin',
  'role_beta',
  'role_user',
]

type PendingChange = {
  user: MotivatorRoleRow
  newRole: MotivatorRoleRow['motivator_role']
} | null

// ── helpers ──────────────────────────────────────────────────────────────────

function VaultCell({ user }: { user: MotivatorRoleRow }) {
  if (!user.has_vault) {
    return <MaterialIcon name="lock_open" size={15} className="text-on-surface-variant/35" />
  }
  return <MaterialIcon name="lock" size={15} className="text-primary/60" filled />
}

function PushCell({ count }: { count: number }) {
  if (count === 0) {
    return <MaterialIcon name="notifications_off" size={15} className="text-on-surface-variant/30" />
  }
  return (
    <span className="inline-flex items-center gap-1">
      <MaterialIcon name="notifications_active" size={15} className="text-primary/60" filled />
      <span className="text-on-surface">{count}</span>
    </span>
  )
}

function roleLabelKey(role: MotivatorRoleRow['motivator_role']): string {
  if (role === 'admin') return 'settings.adminRolesOptionAdmin'
  if (role === 'beta_tester') return 'settings.adminRolesOptionBeta'
  return 'settings.adminRolesOptionUser'
}

// ── confirmation modal ────────────────────────────────────────────────────────

function ConfirmRoleModal({
  pending,
  currentUserId,
  busy,
  onConfirm,
  onCancel,
}: {
  pending: NonNullable<PendingChange>
  currentUserId: string | undefined
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const isSelfDemote =
    pending.user.id === currentUserId &&
    pending.user.motivator_role === 'admin' &&
    pending.newRole !== 'admin'

  // Self-demote requires an explicit checkbox acknowledgement before the Save
  // button becomes enabled — this enforces the "Confirm again" promise of the
  // warning text mechanically, not just visually.
  const [acknowledged, setAcknowledged] = useState(false)
  const saveDisabled = busy || (isSelfDemote && !acknowledged)

  return (
    <div className={MODAL_OVERLAY} onClick={busy ? undefined : onCancel}>
      <div className={cn(MODAL_SHELL, 'max-w-sm')} onClick={(e) => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className={MODAL_TITLE}>{t('settings.adminRolesColRole')}</h2>
          <button
            type="button"
            className={MODAL_CLOSE_BTN}
            onClick={onCancel}
            disabled={busy}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-sm md:p-md">
          {/* User */}
          <p className="break-all text-sm text-on-surface">
            {pending.user.email || pending.user.id}
          </p>

          {/* Role arrow */}
          <div className="flex items-center gap-3">
            <RoleBadge role={pending.user.motivator_role} />
            <MaterialIcon name="arrow_forward" size={16} className="text-on-surface-variant/50" />
            <RoleBadge role={pending.newRole} />
          </div>

          {/* Warning or confirmation text */}
          {isSelfDemote ? (
            <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
              <p className="text-sm font-medium text-amber-400">
                {t('settings.adminRolesConfirmSelfDemote')}
              </p>
              <p className="text-xs text-amber-400/80">
                {t('settings.adminRolesConfirmSelfDemoteAgain')}
              </p>
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-amber-400">
                <input
                  type="checkbox"
                  className="motivator-checkbox mt-0.5 h-3.5 w-3.5 shrink-0"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  disabled={busy}
                />
                <span>{t('settings.adminRolesSelfDemoteAck')}</span>
              </label>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              {t('settings.adminRolesConfirmChange', {
                email: pending.user.email || pending.user.id,
                role: t(roleLabelKey(pending.newRole)),
              })}
            </p>
          )}
        </div>

        <div className={MODAL_FOOTER}>
          <div className="flex justify-end gap-2 py-1">
            <button
              type="button"
              className={SETTINGS_BTN_SECONDARY}
              onClick={onCancel}
              disabled={busy}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={cn(
                SETTINGS_BTN_SECONDARY,
                isSelfDemote
                  ? 'border-amber-400/40 text-amber-400 hover:bg-amber-400/10'
                  : 'border-primary/40 text-primary hover:bg-primary/10',
                saveDisabled && 'opacity-50',
              )}
              onClick={onConfirm}
              disabled={saveDisabled}
            >
              {busy ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function AdminMotivatorRolePanel({
  supabase,
  currentUserId,
  users,
  loadBusy,
  loadError,
  listDegraded,
  onRefresh,
  onReload,
  onLoadError,
}: {
  supabase: SupabaseClient
  currentUserId: string | undefined
  users: MotivatorRoleRow[]
  loadBusy: boolean
  loadError: string | null
  listDegraded?: boolean
  onRefresh: () => void
  onReload: () => Promise<void>
  onLoadError: (message: string | null) => void
}) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<AdminUsersSegmentFilter>('all')
  const [rowBusyId, setRowBusyId] = useState<string | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingChange>(null)

  // mounted guard — prevents setState on unmounted component if the user
  // navigates away mid-request. The Edge Function still completes server-side.
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = users
      .filter((u) => userMatchesSegment(u, segment))
      .filter((u) => !q || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
    return [...list].sort(compareUsersByLastSignIn)
  }, [users, search, segment])

  async function applyRole(user: MotivatorRoleRow, role: MotivatorRoleRow['motivator_role']) {
    if (role === user.motivator_role) return
    onLoadError(null)
    setRowBusyId(user.id)
    const userId = user.id
    const ctrl = new AbortController()
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'setRole', userId, role },
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

  const modalBusy = pendingChange ? rowBusyId === pendingChange.user.id : false

  return (
    <section>
      <div className={SETTINGS_CARD}>
        {/* Search + refresh */}
        <div className="flex flex-col gap-sm sm:flex-row sm:items-center">
          <input
            type="search"
            autoComplete="off"
            placeholder={t('settings.adminRolesSearchPlaceholder')}
            className={`${MOTIVATOR_INPUT} min-w-0 flex-1 placeholder:text-on-surface-variant`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            disabled={loadBusy}
            className={`${SETTINGS_BTN_SECONDARY} shrink-0`}
            onClick={onRefresh}
          >
            {loadBusy ? t('common.loading') : t('settings.adminRolesRefresh')}
          </button>
        </div>

        <div className="mt-sm flex flex-col gap-sm">
        {/* Segment filters */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('admin.dashboard.usersFilterAria')}>
          {SEGMENT_FILTERS.map((id) => (
            <button
              key={id}
              type="button"
              className={cn(chipActive(segment === id), 'text-label-sm')}
              onClick={() => setSegment(id)}
            >
              {id === 'vault_stale_14d'
                ? t(`admin.dashboard.filter.${id}`, { days: STALE_VAULT_DAYS })
                : t(`admin.dashboard.filter.${id}`)}
            </button>
          ))}
        </div>

        {loadError ? (
          <p className="text-xs text-red-400" role="alert">{loadError}</p>
        ) : null}
        {listDegraded ? (
          <p className="text-xs text-amber-400/90" role="status">
            {t('admin.dashboard.listDegraded')}
          </p>
        ) : null}

        <div className="flex items-start gap-1.5 text-xs text-on-surface-variant/70">
          <MaterialIcon name="info" size={14} className="mt-0.5 shrink-0" />
          <span>
            {t('settings.adminRolesSelfHint')}
            {' · '}
            {t('admin.dashboard.usersMetricsHint', { days: STALE_VAULT_DAYS })}
          </span>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-sm md:hidden">
          {filtered.length === 0 && !loadBusy ? (
            <p className="rounded-xl border border-surface-variant px-3 py-6 text-center text-xs text-on-surface-variant">
              {t('settings.adminRolesEmpty')}
            </p>
          ) : null}
          {filtered.map((u) => {
            const busy = rowBusyId === u.id
            const stale = isVaultStale(u)
            return (
              <div
                key={u.id}
                className={cn(
                  'motivator-card px-3 py-3',
                  stale && 'border-l-2 border-l-amber-400/50',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="break-all text-sm text-on-surface">{u.email || u.id}</div>
                    {u.id === currentUserId ? (
                      <div className="mt-0.5 text-[10px] text-on-surface-variant">
                        {t('settings.adminRolesYou')}
                      </div>
                    ) : null}
                  </div>
                  <RoleBadge role={u.motivator_role} />
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <MaterialIcon name="calendar_today" size={12} className="shrink-0" />
                    <span>{formatDate(u.created_at || null)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <MaterialIcon name="login" size={12} className="shrink-0" />
                    <span>{formatDate(u.last_sign_in_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <VaultCell user={u} />
                    <span className={stale ? 'text-amber-400/90' : undefined}>
                      {u.has_vault ? formatDate(u.vault_updated_at) : '—'}
                    </span>
                    {stale ? (
                      <MaterialIcon name="warning" size={12} className="text-amber-400/70" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <PushCell count={u.push_device_count} />
                    {u.push_device_count > 0 ? (
                      <span>{t('admin.dashboard.pushDevices', { count: u.push_device_count })}</span>
                    ) : null}
                  </div>
                  {u.defect_submission_count > 0 ? (
                    <div className="col-span-2 flex items-center gap-1.5 text-on-surface-variant">
                      <MaterialIcon name="bug_report" size={12} className="shrink-0" />
                      <span>{u.defect_submission_count}</span>
                    </div>
                  ) : null}
                </div>

                <label className="mt-3 flex flex-col gap-1">
                  <span className={`${SETTINGS_SUBHEAD} mt-0 text-[10px]`}>
                    {t('settings.adminRolesColRole')}
                  </span>
                  <select
                    className={MOTIVATOR_INPUT}
                    value={u.motivator_role}
                    disabled={busy || loadBusy}
                    onChange={(e) => {
                      requestRoleChange(u, e.target.value as MotivatorRoleRow['motivator_role'])
                    }}
                  >
                    <option value="user">{t('settings.adminRolesOptionUser')}</option>
                    <option value="beta_tester">{t('settings.adminRolesOptionBeta')}</option>
                    <option value="admin">{t('settings.adminRolesOptionAdmin')}</option>
                  </select>
                </label>
              </div>
            )
          })}
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
                  <th
                    key={label}
                    className="px-2.5 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                  >
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
              {filtered.map((u) => {
                const busy = rowBusyId === u.id
                const stale = isVaultStale(u)
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      'border-b border-surface-variant/60 transition-colors last:border-0',
                      'hover:bg-surface-container-high/50',
                      stale && 'border-l-2 border-l-amber-400/40',
                    )}
                  >
                    <td className="max-w-[12rem] px-2.5 py-2.5 align-middle">
                      <div className="truncate text-on-surface" title={u.email || u.id}>
                        {u.email || u.id}
                      </div>
                      {u.id === currentUserId ? (
                        <div className="text-[10px] text-on-surface-variant">
                          {t('settings.adminRolesYou')}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 align-middle text-on-surface-variant">
                      {formatDate(u.created_at || null)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 align-middle text-on-surface-variant">
                      {formatDate(u.last_sign_in_at)}
                    </td>
                    {/* VAULT + СИНХР. объединены */}
                    <td
                      className="px-2.5 py-2.5 align-middle"
                      title={t('admin.dashboard.vaultSyncHint', { days: STALE_VAULT_DAYS })}
                    >
                      <div className="flex items-center gap-1.5">
                        <VaultCell user={u} />
                        {u.has_vault ? (
                          <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-xs', stale ? 'text-amber-400/90' : 'text-on-surface-variant')}>
                            {stale ? <MaterialIcon name="warning" size={12} className="text-amber-400/70" /> : null}
                            {formatDate(u.vault_updated_at)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 align-middle">
                      <PushCell count={u.push_device_count} />
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 align-middle">
                      {u.defect_submission_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-on-surface-variant">
                          <MaterialIcon name="bug_report" size={13} />
                          {u.defect_submission_count}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2.5 align-middle">
                      <select
                        className={`${MOTIVATOR_INPUT} w-[8rem]`}
                        value={u.motivator_role}
                        disabled={busy || loadBusy}
                        onChange={(e) => {
                          requestRoleChange(u, e.target.value as MotivatorRoleRow['motivator_role'])
                        }}
                      >
                        <option value="user">{t('settings.adminRolesOptionUser')}</option>
                        <option value="beta_tester">{t('settings.adminRolesOptionBeta')}</option>
                        <option value="admin">{t('settings.adminRolesOptionAdmin')}</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Role change confirmation modal */}
      {pendingChange ? (
        <ConfirmRoleModal
          pending={pendingChange}
          currentUserId={currentUserId}
          busy={modalBusy}
          onConfirm={confirmChange}
          onCancel={cancelChange}
        />
      ) : null}
    </section>
  )
}
