import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { AdminDashboardActivityChart } from '@/components/admin/AdminDashboardActivityChart'
import { useAdminActivityChart } from '@/components/admin/useAdminActivityChart'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import type { AdminOverview } from '@/types/adminMonitoring'

type KpiCard = {
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

  const o = overview
  const staleDays = o?.stale_vault_days ?? 14

  const cards: KpiCard[] = [
    { icon: 'group', labelKey: 'admin.dashboard.kpiTotal', value: loadBusy ? '…' : String(o?.total_users ?? '—') },
    {
      icon: 'person_add',
      labelKey: 'admin.dashboard.kpiRegistered7d',
      value: loadBusy ? '…' : String(o?.registered_last_7d ?? '—'),
    },
    {
      icon: 'login',
      labelKey: 'admin.dashboard.kpiSignedIn7d',
      value: loadBusy ? '…' : String(o?.signed_in_last_7d ?? '—'),
    },
    {
      icon: 'lock',
      labelKey: 'admin.dashboard.kpiWithVault',
      value: loadBusy ? '…' : String(o?.with_vault ?? '—'),
    },
    {
      icon: 'cloud_off',
      labelKey: 'admin.dashboard.kpiWithoutVault',
      value: loadBusy ? '…' : String(o?.without_vault ?? '—'),
    },
    {
      icon: 'sync_problem',
      labelKey: 'admin.dashboard.kpiVaultStale',
      value: loadBusy ? '…' : String(o?.vault_stale_14d ?? '—'),
    },
    {
      icon: 'notifications',
      labelKey: 'admin.dashboard.kpiWithPush',
      value: loadBusy ? '…' : String(o?.with_push ?? '—'),
    },
    {
      icon: 'bug_report',
      labelKey: 'admin.dashboard.kpiDefects7d',
      value: loadBusy ? '…' : String(o?.defect_submissions_7d ?? '—'),
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

  return (
    <div className="space-y-md">
      <p className="text-body-sm text-on-surface-variant">{t('admin.dashboard.summaryMetricsHint')}</p>
      {loadError ? (
        <p className="text-xs text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}
      {listDegraded ? (
        <p className="text-xs text-amber-400/90" role="status">
          {t('admin.dashboard.listDegraded')}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <article key={c.labelKey} className="motivator-card flex items-center gap-4 p-5">
            <MaterialIcon name={c.icon} className="text-primary" size={28} />
            <div className="min-w-0">
              <p className="text-xs text-on-surface-variant">
                {c.labelKey === 'admin.dashboard.kpiVaultStale'
                  ? t(c.labelKey, { days: staleDays })
                  : t(c.labelKey)}
              </p>
              <p className="font-display text-2xl font-bold text-on-surface">{c.value}</p>
            </div>
          </article>
        ))}
      </div>

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
