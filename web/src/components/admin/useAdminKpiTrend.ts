import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminKpiMetric, AdminKpiTrend } from '@/types/adminMonitoring'
import { parseAdminKpiTrendResponse } from '@/lib/adminMotivatorRolesList'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { invokeAdminFn, useLatestRef } from '@/components/admin/useAbortableInvoke'

export function useAdminKpiTrend(supabase: SupabaseClient | null, metric: AdminKpiMetric | null) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const [trend, setTrend] = useState<AdminKpiTrend | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase || !metric) return
    const tr = tRef.current
    setLoadError(null)
    setTableMissing(false)
    setLoadBusy(true)
    try {
      const result = await invokeAdminFn(supabase, { action: 'kpiTrend', metric }, signal)
      if (!result) return
      if ('error' in result) {
        setLoadError(mapAdminRolesError(result.error, tr))
        return
      }
      const parsed = parseAdminKpiTrendResponse(result.raw.trend)
      if (!parsed) {
        setLoadError(tr('settings.adminRolesErrors.kpi_trend_failed'))
        return
      }
      if (parsed.table_missing) setTableMissing(true)
      setTrend(parsed)
    } finally {
      if (!signal?.aborted) setLoadBusy(false)
    }
  }, [supabase, metric, tRef])

  useEffect(() => {
    if (!metric) {
      setTrend(null)
      setLoadError(null)
      setTableMissing(false)
      return
    }
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, metric])

  return { trend, loadBusy, loadError, tableMissing, reload: load }
}
