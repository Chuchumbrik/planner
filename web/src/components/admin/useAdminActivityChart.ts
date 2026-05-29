import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartDays, ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { ADMIN_ROLES_FN } from '@/lib/adminMonitoringConstants'
import { parseAdminActivityChartResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminActivityChart } from '@/types/adminMonitoring'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'

export function useAdminActivityChart(
  supabase: SupabaseClient | null,
  days: ActivityChartDays,
  role: ActivityChartRoleFilter,
) {
  const { t } = useTranslation()
  const [chart, setChart] = useState<AdminActivityChart | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase) return
    setLoadError(null)
    setTableMissing(false)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'activityChart', days, role },
        signal,
      })
      if (signal?.aborted) return
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        if (msg.includes('activity_table_missing')) {
          setTableMissing(true)
          return
        }
        setLoadError(mapAdminRolesError(msg, t))
        return
      }
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const parsed = parseAdminActivityChartResponse(body?.chart)
      if (!parsed) {
        setLoadError(t('settings.adminRolesErrors.activity_chart_failed'))
        return
      }
      setChart(parsed)
    } catch (e: unknown) {
      if (signal?.aborted) return
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
    } finally {
      if (!signal?.aborted) setLoadBusy(false)
    }
  }, [supabase, days, role, t])

  useEffect(() => {
    if (!supabase) return
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, supabase])

  return { chart, loadBusy, loadError, tableMissing, load }
}
