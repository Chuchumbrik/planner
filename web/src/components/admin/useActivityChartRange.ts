import { useCallback, useEffect, useState } from 'react'
import type { ActivityChartDays } from '@/lib/adminMonitoringConstants'

function isoDateNDaysAgoUtc(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

export function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export { isoDateNDaysAgoUtc }

export function useActivityChartRange(days: ActivityChartDays, onDaysChange: (d: ActivityChartDays) => void) {
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [rangeOpen, setRangeOpen] = useState(false)
  const customRangeActive = dateFrom !== null || dateTo !== null

  useEffect(() => {
    if (customRangeActive) setRangeOpen(true)
  }, [customRangeActive])

  const resetCustomRange = useCallback(() => {
    setDateFrom(null)
    setDateTo(null)
    setRangeOpen(false)
  }, [])

  function setQuickRange(d: ActivityChartDays) {
    resetCustomRange()
    onDaysChange(d)
  }

  const effectiveFrom = dateFrom ?? isoDateNDaysAgoUtc(days - 1)
  const effectiveTo = dateTo ?? todayIsoUtc()

  return {
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    rangeOpen, setRangeOpen,
    customRangeActive,
    effectiveFrom, effectiveTo,
    resetCustomRange,
    setQuickRange,
  }
}
