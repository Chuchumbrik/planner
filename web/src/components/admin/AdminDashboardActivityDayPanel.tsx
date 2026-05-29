import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { RoleBadge } from '@/components/admin/RoleBadge'
import { SETTINGS_BTN_SECONDARY, SETTINGS_CARD } from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import { formatAdminDateTime } from '@/lib/formatAdminDate'
import type { AdminActivityDayDetail } from '@/types/adminMonitoring'

export function AdminDashboardActivityDayPanel({
  detail,
  loadBusy,
  loadError,
  onClose,
  onRefresh,
}: {
  detail: AdminActivityDayDetail | null
  loadBusy: boolean
  loadError: string | null
  onClose: () => void
  onRefresh: () => void
}) {
  const { t, i18n } = useTranslation()
  if (!detail && !loadBusy && !loadError) return null

  const dateLabel = detail?.date ?? '—'
  const count = detail?.users.length ?? 0

  return (
    <div className={cn(SETTINGS_CARD, 'mt-4')}>
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-display text-sm font-semibold text-on-surface">
            {t('admin.dashboard.activityDayTitle', { date: dateLabel })}
          </h4>
          {detail ? (
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {t('admin.dashboard.activityDayCount', { count })}
              {detail.role !== 'all'
                ? ` · ${t(`admin.dashboard.activityChartRole.${detail.role}`)}`
                : ''}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={cn(SETTINGS_BTN_SECONDARY, 'text-xs')}
            disabled={loadBusy || !detail}
            onClick={onRefresh}
          >
            {loadBusy ? t('common.loading') : t('admin.dashboard.activityDayRefresh')}
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <MaterialIcon name="close" size={18} />
          </button>
        </div>
      </div>

      {/* status */}
      {loadError ? (
        <p className="mt-3 text-xs text-red-400" role="alert">{loadError}</p>
      ) : null}

      {/* content */}
      {loadBusy && !detail?.users.length ? (
        <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : detail && detail.users.length === 0 ? (
        <p className="mt-4 text-sm text-on-surface-variant">{t('admin.dashboard.activityDayEmpty')}</p>
      ) : detail ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low">
                {[
                  t('admin.dashboard.activityDayColEmail'),
                  t('admin.dashboard.activityDayColRole'),
                  t('admin.dashboard.activityDayColFirst'),
                  t('admin.dashboard.activityDayColLast'),
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 font-display text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-b border-surface-variant/60 transition-colors last:border-0 hover:bg-surface-container-high/50"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-on-surface">
                    {u.email || u.user_id}
                  </td>
                  <td className="px-3 py-2.5">
                    <RoleBadge role={u.motivator_role} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-on-surface-variant">
                    {formatAdminDateTime(u.first_seen_at, i18n.language)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-on-surface-variant">
                    {formatAdminDateTime(u.last_seen_at, i18n.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* UTC note */}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-on-surface-variant/60">
        <MaterialIcon name="info" size={12} className="shrink-0" />
        {t('admin.dashboard.activityDayUtcNote')}
      </p>
    </div>
  )
}
