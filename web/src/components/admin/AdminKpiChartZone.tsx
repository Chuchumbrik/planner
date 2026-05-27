import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SETTINGS_BTN_SECONDARY } from '@/lib/designClasses'
import type { AdminKpiMetric, AdminKpiTrend } from '@/types/adminMonitoring'

const PAD = { l: 12, r: 12, t: 16, b: 32 }
const VW = 560
const VH = 148
const CW = VW - PAD.l - PAD.r
const CH = VH - PAD.t - PAD.b

function smoothLine(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1)
    d += ` C ${cpx} ${pts[i - 1].y.toFixed(1)} ${cpx} ${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
  }
  return d
}

function areaFill(pts: { x: number; y: number }[], bottom: number): string {
  if (pts.length < 2) return ''
  return `${smoothLine(pts)} L ${pts[pts.length - 1].x.toFixed(1)} ${bottom} L ${pts[0].x.toFixed(1)} ${bottom} Z`
}

function formatLabel(label: string, lang: string): string {
  const [year, month] = label.split('-').map(Number)
  if (!year || !month) return label
  return new Date(year, month - 1, 1).toLocaleDateString(lang, { month: 'short' })
}

type ChartColor = 'mint' | 'coral'

const COLOR: Record<ChartColor, { stroke: string; grad0: string; grad1: string }> = {
  mint: { stroke: '#4edea3', grad0: 'rgba(78,222,163,0.28)', grad1: 'rgba(78,222,163,0)' },
  coral: { stroke: '#ef4444', grad0: 'rgba(239,68,68,0.22)', grad1: 'rgba(239,68,68,0)' },
}

function chartColorForMetric(metric: AdminKpiMetric): ChartColor {
  return metric === 'churn' ? 'coral' : 'mint'
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const color = chartColorForMetric(metric)
  const c = COLOR[color]

  const series = trend?.series ?? []

  const { points, minV, maxV } = useMemo(() => {
    if (series.length < 2) return { points: [], minV: 0, maxV: 1 }
    const vals = series.map((s) => s.value)
    const minV = Math.min(...vals)
    const maxV = Math.max(...vals)
    const range = maxV - minV || 1
    const points = series.map((s, i) => ({
      x: PAD.l + (i / (series.length - 1)) * CW,
      y: PAD.t + CH - ((s.value - minV) / range) * CH,
      ...s,
    }))
    return { points, minV, maxV }
  }, [series])

  const gradId = `kpi-grad-${metric}`
  const lineD = smoothLine(points)
  const areaD = areaFill(points, PAD.t + CH)

  const titleKey = `admin.dashboard.kpiTrend.title.${metric}`
  const unit = trend?.unit ?? ''

  return (
    <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-4">
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
        <div className="relative mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full"
            style={{ minWidth: '260px', maxHeight: '148px' }}
            aria-hidden="true"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.grad0} />
                <stop offset="100%" stopColor={c.grad1} />
              </linearGradient>
            </defs>

            {/* area fill */}
            <path d={areaD} fill={`url(#${gradId})`} />

            {/* line */}
            <path d={lineD} fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" />

            {/* dots + hover targets */}
            {points.map((pt, i) => (
              <g key={pt.label}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === i ? 5 : 3.5}
                  fill={hoveredIdx === i ? c.stroke : '#1c1b1d'}
                  stroke={c.stroke}
                  strokeWidth="2"
                  style={{ transition: 'r 0.1s' }}
                />
                {/* invisible wider hit area */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={14}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                />
                {/* x-axis label */}
                <text
                  x={pt.x}
                  y={VH - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="fill-on-surface-variant/70"
                >
                  {formatLabel(pt.label, i18n.language)}
                </text>
              </g>
            ))}

            {/* tooltip */}
            {hoveredIdx !== null && points[hoveredIdx] ? (() => {
              const pt = points[hoveredIdx]
              const val = series[hoveredIdx].value
              const display = unit === '%' ? `${val}%` : String(val)
              const tipW = 52
              const tipH = 22
              const tipX = Math.min(Math.max(pt.x - tipW / 2, 4), VW - tipW - 4)
              const tipY = pt.y - tipH - 8
              return (
                <g>
                  <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="4" fill="#2a2a2c" stroke={c.stroke} strokeWidth="1" />
                  <text
                    x={tipX + tipW / 2}
                    y={tipY + 14}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={c.stroke}
                  >
                    {display}
                  </text>
                </g>
              )
            })() : null}
          </svg>
        </div>
      )}

      <p className="mt-2 flex items-start gap-1.5 text-xs text-on-surface-variant/70">
        <MaterialIcon name="info" size={13} className="mt-0.5 shrink-0 opacity-60" />
        <span>{t('admin.dashboard.kpiTrend.utcNote')}</span>
      </p>
    </div>
  )
}
