import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { AdminDashboardActivityChart } from '@/components/admin/AdminDashboardActivityChart'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { AdminKpiChartZone } from '@/components/admin/AdminKpiChartZone'
import { InfoTooltip } from '@/components/admin/InfoTooltip'
import { useAdminActivityChart } from '@/components/admin/useAdminActivityChart'
import { useAdminKpiTrend } from '@/components/admin/useAdminKpiTrend'
import { cn } from '@/lib/cn'
import { ADMIN_GRID_GAP, SETTINGS_CARD } from '@/lib/designClasses'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import type { AdminKpiMetric, AdminOverview } from '@/types/adminMonitoring'

// ── secondary stat item ───────────────────────────────────────────────────────

function StatItem({
  icon,
  label,
  value,
  tooltip,
  warn = false,
  loading = false,
  alignTooltipRight = false,
}: {
  icon: string
  label: string
  value: string
  tooltip?: string
  warn?: boolean
  loading?: boolean
  alignTooltipRight?: boolean
}) {
  return (
    <div className="flex items-start gap-sm">
      <MaterialIcon
        name={icon}
        size={18}
        className={cn('mt-0.5 shrink-0', warn ? 'text-amber-400/60' : 'text-on-surface-variant/40')}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-xs text-on-surface-variant">{label}</p>
          {tooltip ? <InfoTooltip text={tooltip} alignRight={alignTooltipRight} /> : null}
        </div>
        {loading ? (
          <div className="mt-1 h-6 w-10 animate-pulse rounded bg-surface-container-highest" />
        ) : (
          <p
            className={cn(
              'mt-0.5 font-display text-xl font-semibold tabular-nums',
              warn ? 'text-amber-400' : 'text-on-surface',
            )}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

// ── stat group with subtle divider ────────────────────────────────────────────

function StatGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-sm">
      <p className="border-b border-surface-variant pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
        {label}
      </p>
      <div className="flex flex-col gap-sm">{children}</div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

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

  const inactiveValue =
    loadBusy ? '…'
    : o
      ? o.total_users === 0 ? '—' : `${((1 - o.mau_30d / o.total_users) * 100).toFixed(1)}%`
      : '—'

  function toggleMetric(metric: AdminKpiMetric) {
    setActiveMetric((prev) => (prev === metric ? null : metric))
  }

  return (
    <>
      {/* ── Status banners ──────────────────────────────────────────────── */}
      {loadError ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2.5 text-xs text-red-400">
          <MaterialIcon name="error_outline" size={14} className="mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      ) : null}

      {listDegraded ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2.5">
          <MaterialIcon name="warning" size={14} className="mt-0.5 shrink-0 text-amber-400/70" />
          <div>
            <p className="text-xs font-medium text-amber-400/90">{t('admin.dashboard.listDegraded')}</p>
            <p className="mt-0.5 text-xs text-amber-400/60">{t('admin.dashboard.listDegradedHint')}</p>
          </div>
        </div>
      ) : null}

      {/* ── Hero KPI bento grid ─────────────────────────────────────────── */}
      {/*
        sm:  2-column
        xl+: bento — Total spans 2 rows, Inactive spans 2 cols
          ┌──────────────────┬───────────┬───────────┐
          │  Всего (tall)    │  Новых 7д │  MAU 30d  │
          │                  ├───────────┴───────────┤
          │                  │  Неактивны (wide)      │
          └──────────────────┴───────────────────────┘
      */}
      <div className={cn('grid items-stretch', ADMIN_GRID_GAP, 'sm:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2')}>
        <div className="h-full xl:row-span-2">
          <AdminKpiCard
            icon="group"
            labelKey="admin.dashboard.kpiTotal"
            value={loadBusy ? '…' : String(o?.total_users ?? '—')}
            tooltip={t('admin.dashboard.kpiTooltip.total')}
            trendMetric="total_users"
            loading={loadBusy}
            isActive={activeMetric === 'total_users'}
            onActivate={() => toggleMetric('total_users')}
          />
        </div>

        <div className="h-full">
          <AdminKpiCard
            icon="person_add"
            labelKey="admin.dashboard.kpiRegistered7d"
            value={loadBusy ? '…' : String(o?.registered_last_7d ?? '—')}
            tooltip={t('admin.dashboard.kpiTooltip.registered7d')}
            trendMetric="registrations"
            loading={loadBusy}
            isActive={activeMetric === 'registrations'}
            onActivate={() => toggleMetric('registrations')}
          />
        </div>

        <div className="h-full">
          <AdminKpiCard
            icon="timeline"
            labelKey="admin.dashboard.kpiMau30d"
            value={loadBusy ? '…' : String(o?.mau_30d ?? '—')}
            tooltip={t('admin.dashboard.kpiTooltip.mau')}
            trendMetric="mau"
            loading={loadBusy}
            isActive={activeMetric === 'mau'}
            onActivate={() => toggleMetric('mau')}
          />
        </div>

        <div className="h-full sm:col-span-2 xl:col-span-2">
          <AdminKpiCard
            icon="person_off"
            labelKey="admin.dashboard.kpiInactive30d"
            value={inactiveValue}
            tooltip={t('admin.dashboard.kpiTooltip.inactive30d')}
            trendMetric="churn"
            danger
            loading={loadBusy}
            isActive={activeMetric === 'churn'}
            onActivate={() => toggleMetric('churn')}
          />
        </div>
      </div>

      {/* ── KPI trend ───────────────────────────────────────────────────── */}
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

      {/* ── Secondary metrics ───────────────────────────────────────────── */}
      <div className={SETTINGS_CARD}>
        <div className={cn('grid', ADMIN_GRID_GAP, 'sm:grid-cols-2 lg:grid-cols-3')}>
          <StatGroup label={t('admin.dashboard.statGroupActivity')}>
            <StatItem
              icon="login"
              label={t('admin.dashboard.kpiSignedIn7d')}
              value={String(o?.signed_in_last_7d ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.signedIn7d')}
              loading={loadBusy}
            />
          </StatGroup>

          <StatGroup label={t('admin.dashboard.statGroupVault')}>
            <StatItem
              icon="lock"
              label={t('admin.dashboard.kpiWithVault')}
              value={String(o?.with_vault ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.withVault')}
              loading={loadBusy}
            />
            <StatItem
              icon="sync_problem"
              label={t('admin.dashboard.kpiVaultStale', { days: staleDays })}
              value={String(o?.vault_stale_14d ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.vaultStale', { days: staleDays })}
              warn={(o?.vault_stale_14d ?? 0) > 0}
              loading={loadBusy}
            />
          </StatGroup>

          <StatGroup label={t('admin.dashboard.statGroupPlatform')}>
            <StatItem
              icon="notifications_active"
              label={t('admin.dashboard.kpiWithPush')}
              value={String(o?.with_push ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.withPush')}
              loading={loadBusy}
            />
            <StatItem
              icon="bug_report"
              label={t('admin.dashboard.kpiDefects7d')}
              value={String(o?.defect_submissions_7d ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.defects7d')}
              warn={(o?.defect_submissions_7d ?? 0) > 0}
              loading={loadBusy}
            />
            <StatItem
              icon="badge"
              label={t('admin.dashboard.kpiRoles')}
              value={
                loadBusy ? '…'
                : o
                  ? t('admin.dashboard.kpiRolesValue', {
                      admin: o.by_role.admin,
                      beta: o.by_role.beta_tester,
                      user: o.by_role.user,
                    })
                  : '—'
              }
              tooltip={t('admin.dashboard.kpiTooltip.roles')}
              loading={loadBusy}
              alignTooltipRight
            />
          </StatGroup>
        </div>
      </div>

      {/* ── Activity chart ──────────────────────────────────────────────── */}
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
    </>
  )
}
