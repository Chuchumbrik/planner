import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { RoleBadge } from '@/components/admin/RoleBadge'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import { isVaultStale } from '@/components/admin/adminDashboardMetrics'
import { STALE_VAULT_DAYS } from '@/lib/adminMonitoringConstants'
import { MOTIVATOR_INPUT, SETTINGS_SUBHEAD } from '@/lib/designClasses'
import { cn } from '@/lib/cn'

function VaultCell({ user }: { user: MotivatorRoleRow }) {
  if (!user.has_vault) return <MaterialIcon name="lock_open" size={15} className="text-on-surface-variant/35" />
  return <MaterialIcon name="lock" size={15} className="text-primary/60" filled />
}

function PushCell({ count }: { count: number }) {
  if (count === 0) return <MaterialIcon name="notifications_off" size={15} className="text-on-surface-variant/30" />
  return (
    <span className="inline-flex items-center gap-1">
      <MaterialIcon name="notifications_active" size={15} className="text-primary/60" filled />
      <span className="text-on-surface">{count}</span>
    </span>
  )
}

type RowProps = {
  user: MotivatorRoleRow
  currentUserId: string | undefined
  busy: boolean
  loadBusy: boolean
  formatDate: (iso: string | null) => string
  onRoleChange: (u: MotivatorRoleRow, role: MotivatorRoleRow['motivator_role']) => void
}

export function UserMobileCard({ user: u, currentUserId, busy, loadBusy, formatDate, onRoleChange }: RowProps) {
  const { t } = useTranslation()
  const stale = isVaultStale(u)
  return (
    <div className={cn('motivator-card px-3 py-3', stale && 'border-l-2 border-l-amber-400/50')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="break-all text-sm text-on-surface">{u.email || u.id}</div>
          {u.id === currentUserId ? (
            <div className="mt-0.5 text-[10px] text-on-surface-variant">{t('settings.adminRolesYou')}</div>
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
          {stale ? <MaterialIcon name="warning" size={12} className="text-amber-400/70" /> : null}
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
        <span className={`${SETTINGS_SUBHEAD} mt-0 text-[10px]`}>{t('settings.adminRolesColRole')}</span>
        <select
          className={MOTIVATOR_INPUT}
          value={u.motivator_role}
          disabled={busy || loadBusy}
          onChange={(e) => onRoleChange(u, e.target.value as MotivatorRoleRow['motivator_role'])}
        >
          <option value="user">{t('settings.adminRolesOptionUser')}</option>
          <option value="beta_tester">{t('settings.adminRolesOptionBeta')}</option>
          <option value="admin">{t('settings.adminRolesOptionAdmin')}</option>
        </select>
      </label>
    </div>
  )
}

export function UserDesktopRow({ user: u, currentUserId, busy, loadBusy, formatDate, onRoleChange }: RowProps) {
  const { t } = useTranslation()
  const stale = isVaultStale(u)
  return (
    <tr
      className={cn(
        'border-b border-surface-variant/60 transition-colors last:border-0',
        'hover:bg-surface-container-high/50',
        stale && 'border-l-2 border-l-amber-400/40',
      )}
    >
      <td className="max-w-[12rem] px-2.5 py-2.5 align-middle">
        <div className="truncate text-on-surface" title={u.email || u.id}>{u.email || u.id}</div>
        {u.id === currentUserId ? (
          <div className="text-[10px] text-on-surface-variant">{t('settings.adminRolesYou')}</div>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-2.5 py-2.5 align-middle text-on-surface-variant">
        {formatDate(u.created_at || null)}
      </td>
      <td className="whitespace-nowrap px-2.5 py-2.5 align-middle text-on-surface-variant">
        {formatDate(u.last_sign_in_at)}
      </td>
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
          onChange={(e) => onRoleChange(u, e.target.value as MotivatorRoleRow['motivator_role'])}
        >
          <option value="user">{t('settings.adminRolesOptionUser')}</option>
          <option value="beta_tester">{t('settings.adminRolesOptionBeta')}</option>
          <option value="admin">{t('settings.adminRolesOptionAdmin')}</option>
        </select>
      </td>
    </tr>
  )
}
