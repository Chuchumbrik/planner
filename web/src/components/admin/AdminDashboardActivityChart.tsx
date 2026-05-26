import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AdminDashboardActivityDayPanel } from '@/components/admin/AdminDashboardActivityDayPanel'
import { useAdminActivityDayUsers } from '@/components/admin/useAdminActivityDayUsers'
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
  supabase,
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
  supabase: SupabaseClient
  onDaysChange: (days: ActivityChartDays) => void
  onRoleChange: (role: ActivityChartRoleFilter) => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const dayUsers = useAdminActivityDayUsers(supabase, selectedDate, role)

  useEffect(() => {
    setSelectedDate(null)
  }, [days, role])

  const maxBar = useMemo(() => {
    if (!chart?.series.length) return 1
    return Math.max(1, ...chart.series.map((b) => b.unique_users))
  }, [chart])

  const roleFilters: ActivityChartRoleFilter[] = ['all', 'admin', 'beta_tester', 'user']

  function handleBarClick(date: string, uniqueUsers: number) {
    if (uniqueUsers <= 0) return
    setSelectedDate((prev) => (prev === date ? null : date))
  }

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
          <p className="mt-1 text-xs text-on-surface-variant/80">
            {t('admin.dashboard.activityChartClickHint')}
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
        <div
          className={`mt-4 flex h-44 items-end gap-1 overflow-x-auto pb-3 pt-2 ${SCROLLBAR_SLIDER_H}`}
          role="list"
          aria-label={t('admin.dashboard.activityChartBarsAria')}
        >
          {chart.series.map((b) => {
            const selected = selectedDate === b.date
            const clickable = b.unique_users > 0
            const barHeight = `${Math.max(6, (b.unique_users / maxBar) * 100)}%`
            return (
              <div
                key={b.date}
                className="flex min-w-[2rem] flex-1 flex-col items-center justify-end gap-1"
                role="listitem"
              >
                {clickable ? (
                  <button
                    type="button"
                    className={cn(
                      'flex w-full max-w-[3rem] flex-col items-center justify-end rounded-t outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-primary/60',
                      selected ? 'ring-2 ring-primary/80' : 'hover:bg-primary/10',
                    )}
                    style={{ height: '100%' }}
                    aria-pressed={selected}
                    aria-label={t('admin.dashboard.activityChartBarAria', {
                      date: b.date,
                      count: b.unique_users,
                    })}
                    onClick={() => handleBarClick(b.date, b.unique_users)}
                  >
                    <div
                      className={cn(
                        'w-full rounded-t',
                        selected ? 'bg-primary' : 'bg-primary/85',
                      )}
                      style={{
                        height: barHeight,
                        minHeight: '12px',
                      }}
                    />
                  </button>
                ) : (
                  <div
                    className="w-full max-w-[3rem] rounded-t bg-primary/25"
                    style={{ height: barHeight, minHeight: '4px' }}
                    title={`${b.date}: 0`}
                  />
                )}
                <span className="max-w-full truncate font-mono text-[10px] text-on-surface-variant">
                  {b.date.slice(5)}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}

      {selectedDate ? (
        <AdminDashboardActivityDayPanel
          detail={dayUsers.detail}
          loadBusy={dayUsers.loadBusy}
          loadError={dayUsers.loadError}
          onClose={() => setSelectedDate(null)}
          onRefresh={() => void dayUsers.reload()}
        />
      ) : null}
    </section>
  )
}
