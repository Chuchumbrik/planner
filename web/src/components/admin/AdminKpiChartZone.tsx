import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SETTINGS_BTN_SECONDARY } from '@/lib/designClasses'
import type { AdminKpiMetric, AdminKpiTrend } from '@/types/adminMonitoring'

type ChartColors = { stroke: string; stopColor: string; stopOpacity: number }

const COLORS: Record<'mint' | 'coral', ChartColors> = {
  mint:  { stroke: '#4edea3', stopColor: '#4edea3', stopOpacity: 0.25 },
  coral: { stroke: '#ef4444', stopColor: '#ef4444', stopOpacity: 0.20 },
}

function colorsForMetric(metric: AdminKpiMetric): ChartColors {
  return metric === 'churn' ? COLORS.coral : COLORS.mint
}

function formatMonthLabel(label: string, lang: string): string {
  const [year, month] = label.split('-').map(Number)
  if (!year || !month) return label
  return new Date(year, month - 1, 1).toLocaleDateString(lang, { month: 'short' })
}

export function AdminKpiChartZone({
  metric,
  trend,
  loadBusy,
  loadError,
  tableMissing,
  onClose,
  onRefresh,
}: {
  metric: AdminKpiMetric
  trend: AdminKpiTrend | null
  loadBusy: boolean
  loadError: string | null
  tableMissing: boolean
  onClose: () => void
  onRefresh: () => void
}) {
  const { t, i18n } = useTranslation()

  const c = colorsForMetric(metric)
  const series = trend?.series ?? []
  const unit = trend?.unit ?? ''
  const gradId = `kpi-area-${metric}`

  const titleKey = `admin.dashboard.kpiTrend.title.${metric}`

  function renderTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null
    const val = (payload[0]?.value as number) ?? 0
    const display = unit === '%' ? `${val.toFixed(1)}%` : String(val)
    const monthLabel = label ? formatMonthLabel(label, i18n.language) : ''
    return (
      <div
        style={{
          background: '#201f22',
          border: `1px solid ${c.stroke}40`,
          borderRadius: 8,
          padding: '6px 10px',
          pointerEvents: 'none',
        }}
      >
        <p style={{ fontSize: 10, color: '#9e9da3', marginBottom: 2 }}>{monthLabel}</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: c.stroke, lineHeight: 1 }}>{display}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="font-display text-sm font-semibold text-on-surface">
            {t(titleKey, { defaultValue: metric })}
          </h4>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {t('admin.dashboard.kpiTrend.hint')}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className={SETTINGS_BTN_SECONDARY}
            disabled={loadBusy}
            onClick={onRefresh}
          >
            {loadBusy ? t('common.loading') : t('admin.dashboard.kpiTrend.refresh')}
          </button>
          <button type="button" className={SETTINGS_BTN_SECONDARY} onClick={onClose}>
            {t('admin.dashboard.activityDayClose')}
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="mt-3 text-xs text-red-400" role="alert">{loadError}</p>
      ) : null}

      {tableMissing ? (
        <p className="mt-3 text-xs text-amber-400/90" role="status">
          {t('admin.dashboard.activityTableMissing')}
        </p>
      ) : null}

      {loadBusy && !series.length ? (
        <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : series.length < 2 ? (
        <p className="mt-4 text-sm text-on-surface-variant">{t('admin.dashboard.kpiTrend.noData')}</p>
      ) : (
        <div className="mt-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c.stopColor} stopOpacity={c.stopOpacity} />
                  <stop offset="95%" stopColor={c.stopColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#353437" vertical={false} />
              <XAxis
                dataKey="label"
                tickFormatter={(v: string) => formatMonthLabel(v, i18n.language)}
                tick={{ fill: '#9e9da3', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={renderTooltip}
                cursor={{ stroke: c.stroke, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={c.stroke}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={{ fill: '#1c1b1d', stroke: c.stroke, strokeWidth: 2, r: 3 }}
                activeDot={{ fill: c.stroke, stroke: c.stroke, r: 5 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-xs text-on-surface-variant/70">
        <MaterialIcon name="info" size={13} className="mt-0.5 shrink-0 opacity-60" />
        <span>{t('admin.dashboard.kpiTrend.utcNote')}</span>
      </p>
    </div>
  )
}
