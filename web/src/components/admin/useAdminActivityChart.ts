import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { parseAdminActivityChartResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminActivityChart } from '@/types/adminMonitoring'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { invokeAdminFn, useLatestRef } from '@/components/admin/useAbortableInvoke'

export function useAdminActivityChart(
  supabase: SupabaseClient | null,
  days: ActivityChartDays,
  role: ActivityChartRoleFilter,
) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const [chart, setChart] = useState<AdminActivityChart | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase) return
    const tr = tRef.current
    setLoadError(null)
    setTableMissing(false)
    setLoadBusy(true)
    try {
      const result = await invokeAdminFn(supabase, { action: 'activityChart', days, role }, signal)
      if (!result) return
      if ('error' in result) {
        if (result.error.includes('activity_table_missing')) {
          setTableMissing(true)
          return
        }
        setLoadError(mapAdminRolesError(result.error, tr))
        return
      }
      const parsed = parseAdminActivityChartResponse(result.raw.chart)
      if (!parsed) {
        setLoadError(tr('settings.adminRolesErrors.activity_chart_failed'))
        return
      }
      setChart(parsed)
    } finally {
      if (!signal?.aborted) setLoadBusy(false)
    }
  }, [supabase, days, role, tRef])

  useEffect(() => {
    if (!supabase) return
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, supabase])

  return { chart, loadBusy, loadError, tableMissing, load }
}
