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
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { useAdminActivityDayUsers } from '@/components/admin/useAdminActivityDayUsers'
import { useActivityChartRange, todayIsoUtc, isoDateNDaysAgoUtc } from '@/components/admin/useActivityChartRange'
import { useActivityChartDisplay } from '@/components/admin/useActivityChartDisplay'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { ACTIVITY_CHART_DAY_OPTIONS } from '@/lib/adminMonitoringConstants'
import { ADMIN_CHART_HEIGHT, SETTINGS_BTN_SECONDARY, chipActive } from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import type { AdminActivityChart } from '@/types/adminMonitoring'

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
  const [dismissedPeakKey, setDismissedPeakKey] = useState<string | null>(null)

  const {
    dateFrom, setDateFrom, dateTo, setDateTo,
    rangeOpen, setRangeOpen,
    customRangeActive, effectiveFrom, effectiveTo,
    resetCustomRange, setQuickRange,
  } = useActivityChartRange(days, onDaysChange)

  const { displaySeries, peak, insufficientKey, xAxisInterval } =
    useActivityChartDisplay(chart, effectiveFrom, effectiveTo, loadBusy, tableMissing)

  const roleFilters: ActivityChartRoleFilter[] = ['all', 'admin', 'beta_tester', 'user']
  const peakKey = peak ? `${peak.date}|${peak.count}` : null
  const showPeakBanner = peak !== null && peakKey !== dismissedPeakKey && !loadBusy

  // Reset selected bar when filters change.
  useEffect(() => { setSelectedDate(null) }, [days, role, dateFrom, dateTo])

  function handleBarClick(date: string, uniqueUsers: number) {
    if (uniqueUsers <= 0) return
    setSelectedDate((prev) => (prev === date ? null : date))
  }

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
      titleTooltip={t('admin.dashboard.activityChartHelp')}
      action={refreshButton}
      collapsible={collapsible}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      {/* ── Filters — single compact row, custom range collapsed by default ─ */}
      <div className="flex flex-col gap-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Period quick presets */}
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

          {/* Custom range toggle — chip-shaped, expands the pickers below */}
          <button
            type="button"
            onClick={() => setRangeOpen((v) => !v)}
            aria-expanded={rangeOpen}
            aria-controls="activity-chart-range-pickers"
            className={cn(
              chipActive(customRangeActive),
              'inline-flex items-center gap-1 text-label-sm',
            )}
          >
            <MaterialIcon name="calendar_month" size={14} />
            {customRangeActive
              ? `${dateFrom ?? '…'} — ${dateTo ?? '…'}`
              : t('admin.dashboard.activityFilterCustomRangeToggle')}
          </button>

          {/* Separator + role chips, same row */}
          <span className="mx-1 hidden h-4 w-px bg-surface-variant/60 sm:inline-block" aria-hidden />
          {roleFilters.map((r) => (
            <button
              key={r}
              type="button"
              className={cn(chipActive(role === r), 'text-label-sm')}
              onClick={() => onRoleChange(r)}
              aria-label={t('admin.dashboard.activityChartRoleAria')}
            >
              {t(`admin.dashboard.activityChartRole.${r}`)}
            </button>
          ))}
        </div>

        {/* Custom range pickers — only when toggle is open OR custom range set */}
        {rangeOpen ? (
          <div
            id="activity-chart-range-pickers"
            className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-variant/60 bg-surface-container-low/50 px-2 py-1.5"
          >
            <input
              type="date"
              value={dateFrom ?? ''}
              max={dateTo ?? todayIsoUtc()}
              min={isoDateNDaysAgoUtc(89)}
              onChange={(e) => setDateFrom(e.target.value || null)}
              // `color-scheme: dark` makes the browser-native calendar popup
              // use the dark palette to match the app theme.
              className="rounded-md border border-surface-variant bg-surface-container px-2 py-1 text-xs text-on-surface [color-scheme:dark] focus:border-primary/60 focus:outline-none"
              aria-label={t('admin.dashboard.activityFilterFrom')}
            />
            <span className="text-on-surface-variant/50">—</span>
            <input
              type="date"
              value={dateTo ?? ''}
              min={dateFrom ?? isoDateNDaysAgoUtc(89)}
              max={todayIsoUtc()}
              onChange={(e) => setDateTo(e.target.value || null)}
              className="rounded-md border border-surface-variant bg-surface-container px-2 py-1 text-xs text-on-surface [color-scheme:dark] focus:border-primary/60 focus:outline-none"
              aria-label={t('admin.dashboard.activityFilterTo')}
            />
            <button
              type="button"
              onClick={resetCustomRange}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <MaterialIcon name="close" size={12} />
              {t('admin.dashboard.activityFilterRangeReset')}
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Status messages ─────────────────────────────────────────────── */}
      {loadError ? (
        <p className="text-xs text-red-400" role="alert">{loadError}</p>
      ) : null}

      {/* ── Insufficient-data banner (yellow) — explains why no chart ───── */}
      {insufficientKey ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-400"
        >
          <MaterialIcon name="warning" size={14} className="mt-0.5 shrink-0" />
          <span>{t(insufficientKey)}</span>
        </div>
      ) : null}

      {/* ── Achievement banner: peak ─ dismissable, re-arms on reload/filter ─ */}
      {showPeakBanner && peak ? (
        <div className="flex items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2">
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
          <button
            type="button"
            onClick={() => setDismissedPeakKey(peakKey)}
            aria-label={t('admin.dashboard.activityPeakDismiss')}
            title={t('admin.dashboard.activityPeakDismiss')}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-amber-400/60 transition-colors hover:bg-amber-400/15 hover:text-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
          >
            <MaterialIcon name="close" size={16} />
          </button>
        </div>
      ) : null}

      {/* ── DAU / WAU summary ───────────────────────────────────────────── */}
      {chart && !loadBusy ? (
        <p className="text-label-sm text-on-surface-variant">
          {t('admin.dashboard.activityDauWau', { dau: chart.dau_today, wau: chart.wau })}
        </p>
      ) : null}

      {/* ── Bar chart — rendered when we have ≥3 non-empty days ───────── */}
      {loadBusy ? (
        <p className="text-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : insufficientKey ? null : displaySeries.length > 0 ? (
        // No horizontal scroll — bars compress to fit the container width.
        // X-axis interval auto-thins labels at small widths.
        <div className={cn('w-full overflow-hidden', ADMIN_CHART_HEIGHT)}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displaySeries}
                margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                barCategoryGap="15%"
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
                  radius={[2, 2, 0, 0]}
                  maxBarSize={28}
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
