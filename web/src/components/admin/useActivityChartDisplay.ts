import { useMemo } from 'react'
import type { AdminActivityChart } from '@/types/adminMonitoring'
import { isoDateNDaysAgoUtc } from './useActivityChartRange'

type Series = AdminActivityChart['series']
type DisplayRow = Series[number] & { isPeak: boolean }
type Insufficient = null | 'tableMissing' | 'retention' | 'few' | 'empty'

export function useActivityChartDisplay(
  chart: AdminActivityChart | null,
  effectiveFrom: string,
  effectiveTo: string,
  loadBusy: boolean,
  tableMissing: boolean,
) {
  const { displaySeries, peak } = useMemo(() => {
    if (!chart) return { displaySeries: [] as DisplayRow[], peak: null }
    const filtered = chart.series.filter((row) => row.date >= effectiveFrom && row.date <= effectiveTo)
    // peak comes pre-computed from the backend; just mark it in the filtered series
    const p = chart.peak
    return {
      displaySeries: filtered.map((row) => ({ ...row, isPeak: p !== null && row.date === p.date })),
      peak: p,
    }
  }, [chart, effectiveFrom, effectiveTo])

  const insufficient: Insufficient = (() => {
    if (loadBusy) return null
    if (tableMissing) return 'tableMissing'
    if (!chart) return null
    if (effectiveFrom < isoDateNDaysAgoUtc(89) && displaySeries.length === 0) return 'retention'
    if (displaySeries.length === 0) return 'empty'
    if (displaySeries.every((b) => b.unique_users === 0)) return 'empty'
    if (displaySeries.length < 3) return 'few'
    return null
  })()

  const count = displaySeries.length
  const xAxisInterval = count <= 14 ? 0 : count <= 30 ? 2 : count <= 60 ? 5 : 10

  const insufficientKey = insufficient
    ? `admin.dashboard.activityChartInsufficient${insufficient.charAt(0).toUpperCase()}${insufficient.slice(1)}`
    : null

  return { displaySeries, peak, insufficient, insufficientKey, xAxisInterval }
}
