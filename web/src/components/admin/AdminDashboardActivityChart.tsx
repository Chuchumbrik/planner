import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { ACTIVITY_CHART_DAY_OPTIONS } from '@/lib/adminMonitoringConstants'
import { SETTINGS_CARD, SCROLLBAR_SLIDER_H, SETTINGS_BTN_SECONDARY, chipActive } from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import type { AdminActivityChart } from '@/types/adminMonitoring'

export function AdminDashboardActivityChart({
  chart,
  loadBusy,
  loadError,
  tableMissing,
  days,
  role,
  onDaysChange,
  onRoleChange,
  onRefresh,
}: {
  chart: AdminActivityChart | null
  loadBusy: boolean
  loadError: string | null
  tableMissing: boolean
  days: ActivityChartDays
  role: ActivityChartRoleFilter
  onDaysChange: (days: ActivityChartDays) => void
  onRoleChange: (role: ActivityChartRoleFilter) => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()

  const maxBar = useMemo(() => {
    if (!chart?.series.length) return 1
    return Math.max(1, ...chart.series.map((b) => b.unique_users))
  }, [chart])

  const roleFilters: ActivityChartRoleFilter[] = ['all', 'admin', 'beta_tester', 'user']

  return (
    <section className={SETTINGS_CARD}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-on-surface">
            {t('admin.dashboard.activityChartTitle')}
          </h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {t('admin.dashboard.activityChartHint')}
          </p>
        </div>
        <button
          type="button"
          className={`${SETTINGS_BTN_SECONDARY} shrink-0`}
          disabled={loadBusy}
          onClick={onRefresh}
        >
          {loadBusy ? t('common.loading') : t('admin.dashboard.activityChartRefresh')}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label={t('admin.dashboard.activityChartDaysAria')}>
        {ACTIVITY_CHART_DAY_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            className={cn(chipActive(days === d), 'text-label-sm')}
            onClick={() => onDaysChange(d)}
          >
            {t('admin.dashboard.activityChartDays', { count: d })}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t('admin.dashboard.activityChartRoleAria')}>
        {roleFilters.map((r) => (
          <button
            key={r}
            type="button"
            className={cn(chipActive(role === r), 'text-label-sm')}
            onClick={() => onRoleChange(r)}
          >
            {t(`admin.dashboard.activityChartRole.${r}`)}
          </button>
        ))}
      </div>

      {tableMissing ? (
        <p className="mt-4 text-xs text-amber-400/90" role="status">
          {t('admin.dashboard.activityTableMissing')}
        </p>
      ) : null}
      {loadError ? (
        <p className="mt-4 text-xs text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}

      {chart && !loadBusy ? (
        <p className="mt-4 text-label-sm text-on-surface-variant">
          {t('admin.dashboard.activityDauWau', { dau: chart.dau_today, wau: chart.wau })}
        </p>
      ) : null}

      {loadBusy ? (
        <p className="mt-6 text-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : chart && chart.series.every((b) => b.unique_users === 0) ? (
        <p className="mt-6 text-sm text-on-surface-variant">{t('admin.dashboard.activityChartEmpty')}</p>
      ) : chart ? (
        <div className={`mt-4 flex h-44 items-end gap-1 overflow-x-auto pb-3 pt-2 ${SCROLLBAR_SLIDER_H}`}>
          {chart.series.map((b) => (
            <div
              key={b.date}
              className="flex min-w-[2rem] flex-1 flex-col items-center justify-end gap-1"
            >
              <div
                className="w-full max-w-[3rem] rounded-t bg-primary/85"
                style={{
                  height: `${Math.max(6, (b.unique_users / maxBar) * 100)}%`,
                  minHeight: b.unique_users > 0 ? '12px' : '4px',
                }}
                title={`${b.date}: ${b.unique_users}`}
              />
              <span className="max-w-full truncate font-mono text-[10px] text-on-surface-variant">
                {b.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
