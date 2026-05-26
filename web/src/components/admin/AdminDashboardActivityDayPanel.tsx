import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SETTINGS_BTN_SECONDARY } from '@/lib/designClasses'
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
    <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="font-display text-sm font-semibold text-on-surface">
            {t('admin.dashboard.activityDayTitle', { date: dateLabel })}
          </h4>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {t('admin.dashboard.activityDayHint')}
          </p>
          {detail ? (
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {t('admin.dashboard.activityDayCount', { count })}
              {detail.role !== 'all'
                ? ` · ${t(`admin.dashboard.activityChartRole.${detail.role}`)}`
                : ''}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className={SETTINGS_BTN_SECONDARY}
            disabled={loadBusy || !detail}
            onClick={onRefresh}
          >
            {loadBusy ? t('common.loading') : t('admin.dashboard.activityDayRefresh')}
          </button>
          <button type="button" className={SETTINGS_BTN_SECONDARY} onClick={onClose}>
            {t('admin.dashboard.activityDayClose')}
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="mt-3 text-xs text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}

      {loadBusy && !detail?.users.length ? (
        <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : detail && detail.users.length === 0 ? (
        <p className="mt-4 text-sm text-on-surface-variant">{t('admin.dashboard.activityDayEmpty')}</p>
      ) : detail ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-label-sm text-on-surface-variant">
                <th className="pb-2 pr-3 font-medium">{t('admin.dashboard.activityDayColEmail')}</th>
                <th className="pb-2 pr-3 font-medium">{t('admin.dashboard.activityDayColRole')}</th>
                <th className="pb-2 pr-3 font-medium">{t('admin.dashboard.activityDayColFirst')}</th>
                <th className="pb-2 font-medium">{t('admin.dashboard.activityDayColLast')}</th>
              </tr>
            </thead>
            <tbody>
              {detail.users.map((u) => (
                <tr key={u.user_id} className="border-b border-outline-variant/20 last:border-0">
                  <td className="py-2 pr-3 font-mono text-xs text-on-surface">
                    {u.email || u.user_id}
                  </td>
                  <td className="py-2 pr-3 text-on-surface-variant">
                    {t(`admin.dashboard.activityChartRole.${u.motivator_role}`)}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap text-on-surface-variant">
                    {formatAdminDateTime(u.first_seen_at, i18n.language)}
                  </td>
                  <td className="py-2 whitespace-nowrap text-on-surface-variant">
                    {formatAdminDateTime(u.last_seen_at, i18n.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-3 flex items-start gap-1.5 text-xs text-on-surface-variant/80">
        <MaterialIcon name="info" size={14} className="mt-0.5 shrink-0 opacity-70" />
        <span>{t('admin.dashboard.activityDayUtcNote')}</span>
      </p>
    </div>
  )
}
