import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { AdminDashboardActivityChart } from '@/components/admin/AdminDashboardActivityChart'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { AdminKpiChartZone } from '@/components/admin/AdminKpiChartZone'
import { InfoTooltip } from '@/components/admin/InfoTooltip'
import { useAdminActivityChart } from '@/components/admin/useAdminActivityChart'
import { useAdminKpiTrend } from '@/components/admin/useAdminKpiTrend'
import { computeInactivePercent } from '@/components/admin/adminOverviewComputations'
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
  valueNode,
  tooltip,
  warn = false,
  loading = false,
  alignTooltipRight = false,
}: {
  icon: string
  label: string
  /** Plain string value for the standard headline-style render. */
  value?: string
  /** Custom node for non-scalar metrics (e.g. role breakdown mini-table).
   *  Takes precedence over `value`. */
  valueNode?: React.ReactNode
  tooltip?: string
  warn?: boolean
  loading?: boolean
  alignTooltipRight?: boolean
}) {
  return (
    <div className="flex items-start gap-xs">
      <MaterialIcon
        name={icon}
        size={18}
        className={cn('mt-0.5 shrink-0', warn ? 'text-amber-400/60' : 'text-on-surface-variant/40')}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-xs text-on-surface-variant">{label}</p>
          {tooltip ? <InfoTooltip text={tooltip} alignRight={alignTooltipRight} /> : null}
        </div>
        {loading ? (
          <div className="mt-1 h-6 w-10 animate-pulse rounded bg-surface-container-highest" />
        ) : valueNode ? (
          <div className="mt-1">{valueNode}</div>
        ) : (
          <p
            className={cn(
              'mt-0.5 font-display text-xl font-semibold tabular-nums',
              warn ? 'text-amber-400' : 'text-on-surface',
            )}
          >
            {value ?? '—'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── role breakdown mini-table ────────────────────────────────────────────────

/**
 * Compact role × count table for the "По ролям" StatItem.
 *
 * Each role is a row: small uppercase label (matches the role-badge palette)
 * + right-aligned count. No bold, since this isn't a single headline number —
 * it's three values that should read as grouped data.
 */
function RolesBreakdownTable({
  counts,
}: {
  counts: { admin: number; beta_tester: number; user: number }
}) {
  const { t } = useTranslation()
  const rows: Array<{ key: 'admin' | 'beta_tester' | 'user'; count: number; tone: string }> = [
    { key: 'admin', count: counts.admin, tone: 'text-primary' },
    { key: 'beta_tester', count: counts.beta_tester, tone: 'text-amber-400' },
    { key: 'user', count: counts.user, tone: 'text-on-surface-variant' },
  ]
  return (
    <dl className="flex flex-col">
      {rows.map((r, i) => (
        <div
          key={r.key}
          className={cn(
            'flex items-baseline justify-between gap-3 py-1',
            // Dotted leader between label and count + subtle row divider
            i > 0 && 'border-t border-dashed border-surface-variant/40',
          )}
        >
          <dt className={cn('text-[10px] font-semibold uppercase tracking-wider', r.tone)}>
            {t(`admin.dashboard.activityChartRole.${r.key}`)}
          </dt>
          <dd className="font-mono text-[13px] tabular-nums text-on-surface">{r.count}</dd>
        </div>
      ))}
    </dl>
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
  // Default is 90d (server retention max) so the activity peak is always
  // included in the initial view — that's the achievement we want to surface.
  const [chartDays, setChartDays] = useState<ActivityChartDays>(90)
  const [chartRole, setChartRole] = useState<ActivityChartRoleFilter>('all')
  const [activityChartCollapsed, setActivityChartCollapsed] = useState(false)
  const activityChart = useAdminActivityChart(supabase, chartDays, chartRole)

  const [activeMetric, setActiveMetric] = useState<AdminKpiMetric | null>(null)
  const kpiTrend = useAdminKpiTrend(supabase, activeMetric)

  const o = overview

  // Show skeletons not only when the request is in flight, but also during the
  // brief initial-mount window before useEffect fires (loadBusy=false, o=null).
  // If a load error has surfaced, we stop showing skeletons so the error banner
  // tells the story instead of an indefinite shimmer.
  const showSkeleton = (loadBusy || !o) && !loadError

  const inactiveValue = computeInactivePercent(o, showSkeleton)

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
        xl:  bento — Total spans 2 rows, Inactive spans 2 cols
          ┌──────────────────┬───────────┬───────────┐
          │  Всего (tall)    │  Новых 7д │  MAU 30d  │
          │                  ├───────────┴───────────┤
          │                  │  Неактивны (wide)      │
          └──────────────────┴───────────────────────┘
        2xl: 4 равные колонки в одну строку
          ┌──────────┬───────────┬───────────┬──────────┐
          │  Всего   │  Новых 7д │  MAU 30d  │Неактивны │
          └──────────┴───────────┴───────────┴──────────┘
      */}
      <div className={cn('grid items-stretch', ADMIN_GRID_GAP, 'sm:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2 2xl:grid-cols-4 2xl:grid-rows-1')}>
        <div className="h-full xl:row-span-2 2xl:row-span-1">
          <AdminKpiCard
            icon="group"
            labelKey="admin.dashboard.kpiTotal"
            value={loadBusy ? '…' : String(o?.total_users ?? '—')}
            tooltip={t('admin.dashboard.kpiTooltip.total')}
            trendMetric="total_users"
            loading={showSkeleton}
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
            loading={showSkeleton}
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
            loading={showSkeleton}
            isActive={activeMetric === 'mau'}
            onActivate={() => toggleMetric('mau')}
          />
        </div>

        <div className="h-full sm:col-span-2 xl:col-span-2 2xl:col-span-1">
          <AdminKpiCard
            icon="person_off"
            labelKey="admin.dashboard.kpiInactive30d"
            value={inactiveValue}
            tooltip={t('admin.dashboard.kpiTooltip.inactive30d')}
            trendMetric="churn"
            danger
            loading={showSkeleton}
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
              loading={showSkeleton}
            />
          </StatGroup>

          <StatGroup label={t('admin.dashboard.statGroupVault')}>
            <StatItem
              icon="lock"
              label={t('admin.dashboard.kpiWithVault')}
              value={String(o?.with_vault ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.withVault')}
              loading={showSkeleton}
            />
            <StatItem
              icon="sync_problem"
              label={t('admin.dashboard.kpiVaultStale')}
              value={String(o?.vault_stale_14d ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.vaultStale')}
              warn={(o?.vault_stale_14d ?? 0) > 0}
              loading={showSkeleton}
            />
          </StatGroup>

          <StatGroup label={t('admin.dashboard.statGroupPlatform')}>
            <StatItem
              icon="notifications_active"
              label={t('admin.dashboard.kpiWithPush')}
              value={String(o?.with_push ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.withPush')}
              loading={showSkeleton}
            />
            <StatItem
              icon="bug_report"
              label={t('admin.dashboard.kpiDefects7d')}
              value={String(o?.defect_submissions_7d ?? '—')}
              tooltip={t('admin.dashboard.kpiTooltip.defects7d')}
              warn={(o?.defect_submissions_7d ?? 0) > 0}
              loading={showSkeleton}
            />
            <StatItem
              icon="badge"
              label={t('admin.dashboard.kpiRoles')}
              valueNode={o ? <RolesBreakdownTable counts={o.by_role} /> : undefined}
              tooltip={t('admin.dashboard.kpiTooltip.roles')}
              loading={showSkeleton}
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
        collapsible
        collapsed={activityChartCollapsed}
        onToggleCollapse={() => setActivityChartCollapsed((v) => !v)}
      />
    </>
  )
}
