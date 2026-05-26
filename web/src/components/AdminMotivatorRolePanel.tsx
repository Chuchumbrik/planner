import { useMemo, useState } from 'react'
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
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import { STALE_VAULT_DAYS } from '@/lib/adminMonitoringConstants'
import {
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
  SETTINGS_CARD,
  SETTINGS_SUBHEAD,
  chipActive,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

export type { MotivatorRoleRow } from '@/types/adminMonitoring'

const ADMIN_ROLES_FN = 'admin-motivator-roles'

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = users
      .filter((u) => userMatchesSegment(u, segment))
      .filter((u) => !q || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
    return [...list].sort(compareUsersByLastSignIn)
  }, [users, search, segment])

  async function applyRole(
    user: MotivatorRoleRow,
    role: MotivatorRoleRow['motivator_role'],
  ) {
    if (role === user.motivator_role) return
    if (user.id === currentUserId && user.motivator_role === 'admin' && role !== 'admin') {
      if (!window.confirm(t('settings.adminRolesConfirmSelfDemote'))) return
      if (!window.confirm(t('settings.adminRolesConfirmSelfDemoteAgain'))) return
    } else if (user.id !== currentUserId) {
      const label = t(`settings.adminRolesOption${role === 'admin' ? 'Admin' : role === 'beta_tester' ? 'Beta' : 'User'}`)
      if (!window.confirm(t('settings.adminRolesConfirmChange', { email: user.email || user.id, role: label }))) {
        return
      }
    }
    onLoadError(null)
    setRowBusyId(user.id)
    const userId = user.id
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'setRole', userId, role },
      })
      if (fnErr) {
        await onReload()
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        onLoadError(mapAdminRolesError(msg, t))
        return
      }
      if (!data || typeof data !== 'object' || !('ok' in data) || !(data as { ok?: unknown }).ok) {
        await onReload()
        onLoadError(t('settings.adminRolesErrors.update_failed'))
        return
      }
      await onReload()
      if (userId === currentUserId) {
        await supabase.auth.refreshSession()
      }
    } catch (e: unknown) {
      await onReload()
      onLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
    } finally {
      setRowBusyId(null)
    }
  }

  function formatDate(iso: string | null) {
    return formatAdminDateTime(iso, i18n.language)
  }

  return (
    <section>
      <p className="text-body-sm text-on-surface-variant">{t('settings.adminRolesHelp')}</p>

      <div className={`mt-4 ${SETTINGS_CARD}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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

        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t('admin.dashboard.usersFilterAria')}>
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
          <p className="mt-3 text-xs text-red-400" role="alert">
            {loadError}
          </p>
        ) : null}
        {listDegraded ? (
          <p className="mt-3 text-xs text-amber-400/90" role="status">
            {t('admin.dashboard.listDegraded')}
          </p>
        ) : null}

        <p className="mt-3 text-label-sm text-on-surface-variant">{t('settings.adminRolesSelfHint')}</p>
        <p className="mt-1 text-label-sm text-on-surface-variant">
          {t('admin.dashboard.usersMetricsHint', { days: STALE_VAULT_DAYS })}
        </p>

        <div className="mt-4 flex flex-col gap-2 md:hidden">
          {filtered.length === 0 && !loadBusy ? (
            <p className="rounded-xl border border-surface-variant px-3 py-6 text-center text-xs text-on-surface-variant">
              {t('settings.adminRolesEmpty')}
            </p>
          ) : null}
          {filtered.map((u) => {
            const busy = rowBusyId === u.id
            return (
              <div key={u.id} className="motivator-card px-3 py-3">
                <div className="min-w-0 break-all text-sm text-on-surface">{u.email || u.id}</div>
                {u.id === currentUserId ? (
                  <div className="mt-0.5 text-[10px] text-on-surface-variant">{t('settings.adminRolesYou')}</div>
                ) : null}
                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-on-surface-variant">
                  <dt>{t('admin.dashboard.colRegistered')}</dt>
                  <dd className="text-on-surface">{formatDate(u.created_at || null)}</dd>
                  <dt>{t('admin.dashboard.colLastSignIn')}</dt>
                  <dd className="text-on-surface">{formatDate(u.last_sign_in_at)}</dd>
                  <dt>{t('admin.dashboard.colVault')}</dt>
                  <dd className="text-on-surface">
                    {u.has_vault ? t('admin.dashboard.vaultYes') : t('admin.dashboard.vaultNo')}
                  </dd>
                  <dt>{t('admin.dashboard.colVaultSync')}</dt>
                  <dd className={isVaultStale(u) ? 'text-amber-400/90' : 'text-on-surface'}>
                    {u.has_vault ? formatDate(u.vault_updated_at) : '—'}
                  </dd>
                  <dt>{t('admin.dashboard.colPush')}</dt>
                  <dd className="text-on-surface">
                    {u.push_device_count > 0
                      ? t('admin.dashboard.pushDevices', { count: u.push_device_count })
                      : '—'}
                  </dd>
                  <dt>{t('admin.dashboard.colDefects')}</dt>
                  <dd className="text-on-surface">
                    {u.defect_submission_count > 0 ? String(u.defect_submission_count) : '—'}
                  </dd>
                </dl>
                <label className="mt-2 flex flex-col gap-1">
                  <span className={`${SETTINGS_SUBHEAD} mt-0 text-[10px]`}>
                    {t('settings.adminRolesColRole')}
                  </span>
                  <select
                    className={MOTIVATOR_INPUT}
                    value={u.motivator_role}
                    disabled={busy || loadBusy}
                    onChange={(e) => {
                      const v = e.target.value as MotivatorRoleRow['motivator_role']
                      if (v === u.motivator_role) return
                      void applyRole(u, v)
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

        <div className="motivator-card mt-4 hidden overflow-x-auto p-0 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low font-display text-xs uppercase tracking-wide text-on-surface-variant">
                <th className="px-3 py-2 font-medium">{t('settings.adminRolesColEmail')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.dashboard.colRegistered')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.dashboard.colLastSignIn')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.dashboard.colVault')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.dashboard.colVaultSync')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.dashboard.colPush')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.dashboard.colDefects')}</th>
                <th className="px-3 py-2 font-medium">{t('settings.adminRolesColRole')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loadBusy ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-xs text-on-surface-variant">
                    {t('settings.adminRolesEmpty')}
                  </td>
                </tr>
              ) : null}
              {filtered.map((u) => {
                const busy = rowBusyId === u.id
                return (
                  <tr key={u.id} className="border-b border-surface-variant/80 last:border-0">
                    <td className="max-w-[14rem] px-3 py-2 align-middle">
                      <div className="truncate text-on-surface" title={u.email || u.id}>
                        {u.email || u.id}
                      </div>
                      {u.id === currentUserId ? (
                        <div className="text-[10px] text-on-surface-variant">{t('settings.adminRolesYou')}</div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-on-surface">
                      {formatDate(u.created_at || null)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-on-surface">
                      {formatDate(u.last_sign_in_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-on-surface">
                      {u.has_vault ? t('admin.dashboard.vaultYes') : t('admin.dashboard.vaultNo')}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 align-middle ${isVaultStale(u) ? 'text-amber-400/90' : 'text-on-surface'}`}
                      title={t('admin.dashboard.vaultSyncHint', { days: STALE_VAULT_DAYS })}
                    >
                      {u.has_vault ? formatDate(u.vault_updated_at) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-on-surface">
                      {u.push_device_count > 0
                        ? t('admin.dashboard.pushDevices', { count: u.push_device_count })
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-on-surface">
                      {u.defect_submission_count > 0 ? u.defect_submission_count : '—'}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <select
                        className={`${MOTIVATOR_INPUT} max-w-[11rem]`}
                        value={u.motivator_role}
                        disabled={busy || loadBusy}
                        onChange={(e) => {
                          const v = e.target.value as MotivatorRoleRow['motivator_role']
                          if (v === u.motivator_role) return
                          void applyRole(u, v)
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
    </section>
  )
}
