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
import { AdminCardSection } from '@/components/admin/AdminCardSection'
import { AdminDashboardActivityDayPanel } from '@/components/admin/AdminDashboardActivityDayPanel'
import { useAdminActivityDayUsers } from '@/components/admin/useAdminActivityDayUsers'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { ACTIVITY_CHART_DAY_OPTIONS } from '@/lib/adminMonitoringConstants'
import { ADMIN_CHART_HEIGHT, SCROLLBAR_SLIDER_H, SETTINGS_BTN_SECONDARY, chipActive } from '@/lib/designClasses'
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
  collapsible,
  collapsed,
  onToggleCollapse,
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
  collapsible?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
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

  const refreshButton = (
    <button
      type="button"
      className={SETTINGS_BTN_SECONDARY}
      disabled={loadBusy}
      onClick={onRefresh}
    >
      {loadBusy ? t('common.loading') : t('admin.dashboard.activityChartRefresh')}
    </button>
  )

  return (
    <AdminCardSection
      title={t('admin.dashboard.activityChartTitle')}
      hint={t('admin.dashboard.activityChartHint')}
      hint2={t('admin.dashboard.activityChartClickHint')}
      action={refreshButton}
      collapsible={collapsible}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      {/* filters */}
      <div className="flex flex-col gap-sm">
        <div
          className="flex flex-wrap gap-1.5"
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
          className="flex flex-wrap gap-1.5"
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
      </div>

      {/* status messages */}
      {tableMissing ? (
        <p className="text-xs text-amber-400/90" role="status">
          {t('admin.dashboard.activityTableMissing')}
        </p>
      ) : null}
      {loadError ? (
        <p className="text-xs text-red-400" role="alert">{loadError}</p>
      ) : null}

      {/* DAU / WAU summary */}
      {chart && !loadBusy ? (
        <p className="text-label-sm text-on-surface-variant">
          {t('admin.dashboard.activityDauWau', { dau: chart.dau_today, wau: chart.wau })}
        </p>
      ) : null}

      {/* bar chart */}
      {loadBusy ? (
        <p className="text-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : isEmpty ? (
        <p className="text-sm text-on-surface-variant">{t('admin.dashboard.activityChartEmpty')}</p>
      ) : chart ? (
        <div className={cn('overflow-x-auto', SCROLLBAR_SLIDER_H)}>
          <div
            className={ADMIN_CHART_HEIGHT}
            style={{ minWidth: `${Math.max(chart.series.length * 24, 280)}px` }}
          >
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chart.series}
              margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#353437" vertical={false} />
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
                  // Recharts 2.x spreads the datum into the callback arg AND
                  // nests it under `payload`. Prefer `payload` since that's
                  // the documented contract — falls back to the spread fields
                  // if `payload` is absent.
                  const arg = data as
                    | { payload?: { date?: unknown; unique_users?: unknown }; date?: unknown; unique_users?: unknown }
                    | null
                    | undefined
                  const row = arg?.payload ?? arg
                  if (!row || typeof row.date !== 'string' || typeof row.unique_users !== 'number') return
                  handleBarClick(row.date, row.unique_users)
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

      {/* day detail panel */}
      {selectedDate ? (
        <AdminDashboardActivityDayPanel
          detail={dayUsers.detail}
          loadBusy={dayUsers.loadBusy}
          loadError={dayUsers.loadError}
          onClose={() => setSelectedDate(null)}
          onRefresh={() => void dayUsers.reload()}
        />
      ) : null}
    </AdminCardSection>
  )
}
