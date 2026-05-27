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

type KpiCard = {
  icon: string
  labelKey: string
  value: string
  trendMetric?: AdminKpiMetric
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

  const cards: KpiCard[] = [
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
      value: loadBusy ? '…' : o ? `${((1 - o.mau_30d / Math.max(o.total_users, 1)) * 100).toFixed(1)}%` : '—',
      trendMetric: 'churn',
    },
    {
      icon: 'login',
      labelKey: 'admin.dashboard.kpiSignedIn7d',
      value: fmtNum(o?.signed_in_last_7d),
    },
    {
      icon: 'lock',
      labelKey: 'admin.dashboard.kpiWithVault',
      value: fmtNum(o?.with_vault),
    },
    {
      icon: 'cloud_off',
      labelKey: 'admin.dashboard.kpiWithoutVault',
      value: fmtNum(o?.without_vault),
    },
    {
      icon: 'sync_problem',
      labelKey: 'admin.dashboard.kpiVaultStale',
      value: fmtNum(o?.vault_stale_14d),
    },
    {
      icon: 'notifications',
      labelKey: 'admin.dashboard.kpiWithPush',
      value: fmtNum(o?.with_push),
    },
    {
      icon: 'bug_report',
      labelKey: 'admin.dashboard.kpiDefects7d',
      value: fmtNum(o?.defect_submissions_7d),
    },
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

      {activeMetric ? null : (
        <p className="text-xs text-on-surface-variant/60">{t('admin.dashboard.kpiTrend.clickHint')}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const isActive = activeMetric === c.trendMetric
          return (
            <article
              key={c.labelKey}
              className={cn(
                'motivator-card flex items-center gap-4 p-5 transition-colors',
                c.trendMetric && 'cursor-pointer hover:bg-surface-container-high',
                isActive && 'ring-2 ring-primary bg-surface-container-high',
              )}
              onClick={c.trendMetric ? () => handleCardClick(c.trendMetric!) : undefined}
              role={c.trendMetric ? 'button' : undefined}
              aria-pressed={c.trendMetric ? isActive : undefined}
              tabIndex={c.trendMetric ? 0 : undefined}
              onKeyDown={
                c.trendMetric
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleCardClick(c.trendMetric!)
                      }
                    }
                  : undefined
              }
            >
              <MaterialIcon
                name={c.icon}
                className={isActive ? 'text-primary' : 'text-primary/70'}
                size={28}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-on-surface-variant">
                  {c.labelKey === 'admin.dashboard.kpiVaultStale'
                    ? t(c.labelKey, { days: staleDays })
                    : t(c.labelKey)}
                </p>
                <p className="font-display text-2xl font-bold text-on-surface">{c.value}</p>
              </div>
              {c.trendMetric ? (
                <MaterialIcon
                  name="trending_up"
                  size={16}
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-primary' : 'text-on-surface-variant/40',
                  )}
                />
              ) : null}
            </article>
          )
        })}
      </div>

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
