import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { AdminDashboardActivityChart } from '@/components/admin/AdminDashboardActivityChart'
import { AdminKpiChartZone } from '@/components/admin/AdminKpiChartZone'
import { useAdminActivityChart } from '@/components/admin/useAdminActivityChart'
import { useAdminKpiTrend } from '@/components/admin/useAdminKpiTrend'
import { cn } from '@/lib/cn'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import type { AdminKpiMetric, AdminOverview } from '@/types/adminMonitoring'

type HeroCard = {
  icon: string
  labelKey: string
  value: string
  trendMetric: AdminKpiMetric
  danger?: boolean
}

type DetailStat = {
  icon: string
  labelKey: string
  value: string
}

export function AdminDashboardSummaryTab({
  overview,
  loadBusy,
  loadError,
  listDegraded,
  supabase,
}: {
  overview: AdminOverview | null
  loadBusy: boolean
  loadError: string | null
  listDegraded: boolean
  supabase: SupabaseClient
}) {
  const { t } = useTranslation()
  const [chartDays, setChartDays] = useState<ActivityChartDays>(30)
  const [chartRole, setChartRole] = useState<ActivityChartRoleFilter>('all')
  const activityChart = useAdminActivityChart(supabase, chartDays, chartRole)

  const [activeMetric, setActiveMetric] = useState<AdminKpiMetric | null>(null)
  const kpiTrend = useAdminKpiTrend(supabase, activeMetric)

  const o = overview
  const staleDays = o?.stale_vault_days ?? 14

  function fmtNum(val: number | undefined): string {
    return loadBusy ? '…' : val != null ? String(val) : '—'
  }

  const heroCards: HeroCard[] = [
    {
      icon: 'group',
      labelKey: 'admin.dashboard.kpiTotal',
      value: fmtNum(o?.total_users),
      trendMetric: 'total_users',
    },
    {
      icon: 'person_add',
      labelKey: 'admin.dashboard.kpiRegistered7d',
      value: fmtNum(o?.registered_last_7d),
      trendMetric: 'registrations',
    },
    {
      icon: 'timeline',
      labelKey: 'admin.dashboard.kpiMau30d',
      value: fmtNum(o?.mau_30d),
      trendMetric: 'mau',
    },
    {
      icon: 'trending_down',
      labelKey: 'admin.dashboard.kpiChurn30d',
      value: loadBusy ? '…' : o ? (o.total_users === 0 ? '—' : `${((1 - o.mau_30d / o.total_users) * 100).toFixed(1)}%`) : '—',
      trendMetric: 'churn',
      danger: true,
    },
  ]

  const detailStats: DetailStat[] = [
    { icon: 'login', labelKey: 'admin.dashboard.kpiSignedIn7d', value: fmtNum(o?.signed_in_last_7d) },
    { icon: 'lock', labelKey: 'admin.dashboard.kpiWithVault', value: fmtNum(o?.with_vault) },
    { icon: 'cloud_off', labelKey: 'admin.dashboard.kpiWithoutVault', value: fmtNum(o?.without_vault) },
    { icon: 'sync_problem', labelKey: 'admin.dashboard.kpiVaultStale', value: fmtNum(o?.vault_stale_14d) },
    { icon: 'notifications', labelKey: 'admin.dashboard.kpiWithPush', value: fmtNum(o?.with_push) },
    { icon: 'bug_report', labelKey: 'admin.dashboard.kpiDefects7d', value: fmtNum(o?.defect_submissions_7d) },
    {
      icon: 'badge',
      labelKey: 'admin.dashboard.kpiRoles',
      value: loadBusy
        ? '…'
        : o
          ? t('admin.dashboard.kpiRolesValue', {
              admin: o.by_role.admin,
              beta: o.by_role.beta_tester,
              user: o.by_role.user,
            })
          : '—',
    },
  ]

  function handleCardClick(metric: AdminKpiMetric) {
    setActiveMetric((prev) => (prev === metric ? null : metric))
  }

  return (
    <div className="space-y-md">
      <p className="text-body-sm text-on-surface-variant">{t('admin.dashboard.summaryMetricsHint')}</p>

      {loadError ? (
        <p className="text-xs text-red-400" role="alert">{loadError}</p>
      ) : null}
      {listDegraded ? (
        <p className="text-xs text-amber-400/90" role="status">{t('admin.dashboard.listDegraded')}</p>
      ) : null}

      {/* Hero KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {heroCards.map((c) => {
          const isActive = activeMetric === c.trendMetric
          return (
            <article
              key={c.labelKey}
              className={cn(
                'motivator-card relative flex flex-col justify-between gap-4 overflow-hidden p-5 transition-colors',
                'cursor-pointer hover:bg-surface-container-high',
                isActive && 'bg-surface-container-high ring-2 ring-primary',
              )}
              onClick={() => handleCardClick(c.trendMetric)}
              role="button"
              aria-pressed={isActive}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardClick(c.trendMetric)
                }
              }}
            >
              {/* accent top bar */}
              <div
                className={cn(
                  'absolute inset-x-0 top-0 h-0.5',
                  c.danger ? 'bg-red-400/60' : 'bg-primary/60',
                )}
              />

              {/* label + icon */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  {t(c.labelKey)}
                </p>
                <MaterialIcon
                  name={c.icon}
                  size={16}
                  className={cn('shrink-0', c.danger ? 'text-red-400/30' : 'text-primary/30')}
                />
              </div>

              {/* value */}
              <p
                className={cn(
                  'font-display text-4xl font-bold leading-none tabular-nums',
                  c.danger ? 'text-red-400' : 'text-on-surface',
                )}
              >
                {c.value}
              </p>

              {/* trend hint */}
              <div
                className={cn(
                  'flex items-center gap-1 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-on-surface-variant/40',
                )}
              >
                <MaterialIcon name="show_chart" size={12} />
                <span>{t('admin.dashboard.kpiTrend.clickHint')}</span>
              </div>
            </article>
          )
        })}
      </div>

      {/* Trend chart (expands below hero row on click) */}
      {activeMetric ? (
        <AdminKpiChartZone
          metric={activeMetric}
          trend={kpiTrend.trend}
          loadBusy={kpiTrend.loadBusy}
          loadError={kpiTrend.loadError}
          tableMissing={kpiTrend.tableMissing}
          onClose={() => setActiveMetric(null)}
          onRefresh={() => void kpiTrend.reload()}
        />
      ) : null}

      {/* Secondary stats */}
      <div className="motivator-card p-sm md:p-md">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {detailStats.map((s) => (
            <div key={s.labelKey} className="flex items-start gap-3">
              <MaterialIcon
                name={s.icon}
                size={18}
                className="mt-0.5 shrink-0 text-on-surface-variant/40"
              />
              <div className="min-w-0">
                <p className="text-xs text-on-surface-variant">
                  {s.labelKey === 'admin.dashboard.kpiVaultStale'
                    ? t(s.labelKey, { days: staleDays })
                    : t(s.labelKey)}
                </p>
                <p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-on-surface">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity chart */}
      <AdminDashboardActivityChart
        chart={activityChart.chart}
        loadBusy={activityChart.loadBusy}
        loadError={activityChart.loadError}
        tableMissing={activityChart.tableMissing}
        days={chartDays}
        role={chartRole}
        supabase={supabase}
        onDaysChange={setChartDays}
        onRoleChange={setChartRole}
        onRefresh={() => void activityChart.load()}
      />
    </div>
  )
}
