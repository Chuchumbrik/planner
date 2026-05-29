import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { AdminDashboardActivityDayPanel } from '@/components/admin/AdminDashboardActivityDayPanel'
import { useAdminActivityDayUsers } from '@/components/admin/useAdminActivityDayUsers'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { ACTIVITY_CHART_DAY_OPTIONS } from '@/lib/adminMonitoringConstants'
import { SETTINGS_CARD, SCROLLBAR_SLIDER_H, SETTINGS_BTN_SECONDARY, chipActive } from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import type { AdminActivityChart } from '@/types/adminMonitoring'

function ActivityBarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload as { date: string; unique_users: number }
  return (
    <div
      style={{
        background: '#201f22',
        border: '1px solid #353437',
        borderRadius: 8,
        padding: '6px 10px',
        pointerEvents: 'none',
      }}
    >
      <p style={{ fontSize: 10, color: '#9e9da3', marginBottom: 2, fontFamily: 'monospace' }}>
        {entry.date}
      </p>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#4edea3', lineHeight: 1 }}>
        {entry.unique_users}
      </p>
    </div>
  )
}

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

  const roleFilters: ActivityChartRoleFilter[] = ['all', 'admin', 'beta_tester', 'user']

  function handleBarClick(date: string, uniqueUsers: number) {
    if (uniqueUsers <= 0) return
    setSelectedDate((prev) => (prev === date ? null : date))
  }

  const xAxisInterval = days === 7 ? 0 : days === 90 ? 8 : 3

  const isEmpty = chart && chart.series.every((b) => b.unique_users === 0)

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
          <p className="mt-1 text-xs text-on-surface-variant/70">
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

      <div
        className="mt-4 flex flex-wrap gap-1.5"
        role="group"
        aria-label={t('admin.dashboard.activityChartDaysAria')}
      >
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

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        role="group"
        aria-label={t('admin.dashboard.activityChartRoleAria')}
      >
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
      ) : isEmpty ? (
        <p className="mt-6 text-sm text-on-surface-variant">{t('admin.dashboard.activityChartEmpty')}</p>
      ) : chart ? (
        <div className={cn('mt-4 overflow-x-auto', SCROLLBAR_SLIDER_H)}>
          <div style={{ minWidth: `${Math.max(chart.series.length * 20, 300)}px`, height: 192 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart.series}
                margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                barCategoryGap="25%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#353437"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fill: '#9e9da3', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={xAxisInterval}
                />
                <Tooltip
                  content={<ActivityBarTooltip />}
                  cursor={{ fill: 'rgba(78,222,163,0.06)', radius: 4 }}
                />
                <Bar
                  dataKey="unique_users"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                  onClick={(data) => {
                    const entry = data as { date: string; unique_users: number }
                    handleBarClick(entry.date, entry.unique_users)
                  }}
                >
                  {chart.series.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={
                        entry.unique_users === 0
                          ? 'rgba(78,222,163,0.15)'
                          : selectedDate === entry.date
                            ? '#4edea3'
                            : 'rgba(78,222,163,0.70)'
                      }
                      cursor={entry.unique_users > 0 ? 'pointer' : 'default'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
