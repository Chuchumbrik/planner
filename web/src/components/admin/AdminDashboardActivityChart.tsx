import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { useAdminActivityDayUsers } from '@/components/admin/useAdminActivityDayUsers'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { ACTIVITY_CHART_DAY_OPTIONS } from '@/lib/adminMonitoringConstants'
import { ADMIN_CHART_HEIGHT, SCROLLBAR_SLIDER_H, SETTINGS_BTN_SECONDARY, chipActive } from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import type { AdminActivityChart } from '@/types/adminMonitoring'

// ── helpers ───────────────────────────────────────────────────────────────────

type Series = AdminActivityChart['series']
type Peak = { date: string; count: number } | null

/**
 * Find the activity peak in a series. When multiple days tie at the max, the
 * *latest* one wins — feels more like "current best record" than archeology.
 */
function findPeak(series: Series): Peak {
  let best: Peak = null
  for (const row of series) {
    if (row.unique_users <= 0) continue
    if (!best || row.unique_users >= best.count) {
      best = { date: row.date, count: row.unique_users }
    }
  }
  return best
}

function isoDateNDaysAgoUtc(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatLongDate(iso: string, lang: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  if (!y || !m || !day) return iso
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(lang, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// ── tooltip ───────────────────────────────────────────────────────────────────

function ActivityBarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload as {
    date: string
    unique_users: number
    isPeak?: boolean
  }
  return (
    <div
      style={{
        background: '#201f22',
        border: `1px solid ${entry.isPeak ? '#facc15' : '#353437'}`,
        borderRadius: 8,
        padding: '6px 10px',
        pointerEvents: 'none',
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: '#9e9da3',
          marginBottom: 2,
          fontFamily: 'monospace',
        }}
      >
        {entry.date}
        {entry.isPeak ? ' 🏆' : ''}
      </p>
      <p
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: entry.isPeak ? '#facc15' : '#4edea3',
          lineHeight: 1,
        }}
      >
        {entry.unique_users}
      </p>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

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
  const { t, i18n } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const dayUsers = useAdminActivityDayUsers(supabase, selectedDate, role)

  // Custom from/to range. `null` means "use the quick-preset days window".
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const customRangeActive = dateFrom !== null || dateTo !== null

  useEffect(() => {
    setSelectedDate(null)
  }, [days, role, dateFrom, dateTo])

  const roleFilters: ActivityChartRoleFilter[] = ['all', 'admin', 'beta_tester', 'user']

  function handleBarClick(date: string, uniqueUsers: number) {
    if (uniqueUsers <= 0) return
    setSelectedDate((prev) => (prev === date ? null : date))
  }

  // Resolve the effective range: custom range wins, otherwise preset N days.
  const effectiveFrom = dateFrom ?? isoDateNDaysAgoUtc(days - 1)
  const effectiveTo = dateTo ?? todayIsoUtc()

  // Filter server series to the effective range, mark peak.
  const { displaySeries, peak } = useMemo(() => {
    if (!chart) return { displaySeries: [] as Array<Series[number] & { isPeak: boolean }>, peak: null }
    const filtered = chart.series.filter((row) => {
      return row.date >= effectiveFrom && row.date <= effectiveTo
    })
    const p = findPeak(filtered)
    return {
      displaySeries: filtered.map((row) => ({
        ...row,
        isPeak: p !== null && row.date === p.date,
      })),
      peak: p,
    }
  }, [chart, effectiveFrom, effectiveTo])

  const xAxisCount = displaySeries.length
  const xAxisInterval = xAxisCount <= 14 ? 0 : xAxisCount <= 30 ? 3 : 8
  const isEmpty = displaySeries.length > 0 && displaySeries.every((b) => b.unique_users === 0)
  const isOutOfRange = displaySeries.length === 0 && chart !== null && !loadBusy

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

  const resetCustomRange = useCallback(() => {
    setDateFrom(null)
    setDateTo(null)
  }, [])

  function setQuickRange(d: ActivityChartDays) {
    resetCustomRange()
    onDaysChange(d)
  }

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
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-sm">
        {/* Quick presets row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
            {t('admin.dashboard.activityFilterPeriod')}
          </span>
          {ACTIVITY_CHART_DAY_OPTIONS.map((d) => {
            const isActive = !customRangeActive && days === d
            return (
              <button
                key={d}
                type="button"
                className={cn(chipActive(isActive), 'text-label-sm')}
                onClick={() => setQuickRange(d)}
              >
                {t('admin.dashboard.activityChartDays', { count: d })}
              </button>
            )
          })}
        </div>

        {/* Custom date range row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
            {t('admin.dashboard.activityFilterRange')}
          </span>
          <input
            type="date"
            value={dateFrom ?? ''}
            max={dateTo ?? todayIsoUtc()}
            min={isoDateNDaysAgoUtc(89)}
            onChange={(e) => setDateFrom(e.target.value || null)}
            className="rounded-lg border border-surface-variant bg-surface-container-low px-2 py-1 text-xs text-on-surface focus:border-primary/60 focus:outline-none"
            aria-label={t('admin.dashboard.activityFilterFrom')}
          />
          <span className="text-on-surface-variant/50">—</span>
          <input
            type="date"
            value={dateTo ?? ''}
            min={dateFrom ?? isoDateNDaysAgoUtc(89)}
            max={todayIsoUtc()}
            onChange={(e) => setDateTo(e.target.value || null)}
            className="rounded-lg border border-surface-variant bg-surface-container-low px-2 py-1 text-xs text-on-surface focus:border-primary/60 focus:outline-none"
            aria-label={t('admin.dashboard.activityFilterTo')}
          />
          {customRangeActive ? (
            <button
              type="button"
              onClick={resetCustomRange}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <MaterialIcon name="close" size={12} />
              {t('admin.dashboard.activityFilterRangeReset')}
            </button>
          ) : null}
        </div>

        {/* Role row */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label={t('admin.dashboard.activityChartRoleAria')}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
            {t('admin.dashboard.activityFilterRole')}
          </span>
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

      {/* ── Status messages ─────────────────────────────────────────────── */}
      {tableMissing ? (
        <p className="text-xs text-amber-400/90" role="status">
          {t('admin.dashboard.activityTableMissing')}
        </p>
      ) : null}
      {loadError ? (
        <p className="text-xs text-red-400" role="alert">{loadError}</p>
      ) : null}

      {/* ── Achievement banner: peak ────────────────────────────────────── */}
      {peak && !loadBusy ? (
        <div className="flex items-center gap-3 rounded-lg border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-amber-400/0 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
            <MaterialIcon name="emoji_events" size={18} className="text-amber-400" filled />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
              {t('admin.dashboard.activityPeakTitle')}
            </p>
            <p className="text-sm text-on-surface">
              {t('admin.dashboard.activityPeakValue', {
                count: peak.count,
                date: formatLongDate(peak.date, i18n.language),
              })}
            </p>
          </div>
        </div>
      ) : null}

      {/* ── DAU / WAU summary ───────────────────────────────────────────── */}
      {chart && !loadBusy ? (
        <p className="text-label-sm text-on-surface-variant">
          {t('admin.dashboard.activityDauWau', { dau: chart.dau_today, wau: chart.wau })}
        </p>
      ) : null}

      {/* ── Bar chart ───────────────────────────────────────────────────── */}
      {loadBusy ? (
        <p className="text-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : isOutOfRange ? (
        <p className="text-sm text-on-surface-variant">{t('admin.dashboard.activityChartOutOfRange')}</p>
      ) : isEmpty ? (
        <p className="text-sm text-on-surface-variant">{t('admin.dashboard.activityChartEmpty')}</p>
      ) : displaySeries.length > 0 ? (
        <div className={cn('overflow-x-auto', SCROLLBAR_SLIDER_H)}>
          <div
            className={ADMIN_CHART_HEIGHT}
            style={{ minWidth: `${Math.max(displaySeries.length * 24, 280)}px` }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displaySeries}
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
                  onClick={(data: unknown) => {
                    const arg = data as
                      | { payload?: { date?: unknown; unique_users?: unknown }; date?: unknown; unique_users?: unknown }
                      | null
                      | undefined
                    const row = arg?.payload ?? arg
                    if (!row || typeof row.date !== 'string' || typeof row.unique_users !== 'number') return
                    handleBarClick(row.date, row.unique_users)
                  }}
                >
                  {displaySeries.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={
                        entry.unique_users === 0
                          ? 'rgba(78,222,163,0.15)'
                          : entry.isPeak
                            ? '#facc15' // amber-400 — peak achievement
                            : selectedDate === entry.date
                              ? '#4edea3'
                              : 'rgba(78,222,163,0.70)'
                      }
                      stroke={entry.isPeak ? '#facc15' : undefined}
                      strokeWidth={entry.isPeak ? 1.5 : 0}
                      cursor={entry.unique_users > 0 ? 'pointer' : 'default'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* ── Day detail panel ────────────────────────────────────────────── */}
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
