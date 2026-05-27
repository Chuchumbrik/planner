import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminKpiMetric, AdminKpiTrend } from '@/types/adminMonitoring'
import { parseAdminKpiTrendResponse } from '@/lib/adminMotivatorRolesList'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'

const ADMIN_ROLES_FN = 'admin-motivator-roles'

export function useAdminKpiTrend(supabase: SupabaseClient | null, metric: AdminKpiMetric | null) {
  const { t } = useTranslation()
  const [trend, setTrend] = useState<AdminKpiTrend | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)

  const load = useCallback(async () => {
    if (!supabase || !metric) return
    setLoadError(null)
    setTableMissing(false)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'kpiTrend', metric },
      })
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, t))
        return
      }
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const parsed = parseAdminKpiTrendResponse(body?.trend)
      if (!parsed) {
        setLoadError(t('settings.adminRolesErrors.activity_chart_failed'))
        return
      }
      if (parsed.table_missing) {
        setTableMissing(true)
        setTrend(parsed)
        return
      }
      setTrend(parsed)
    } catch (e: unknown) {
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
    } finally {
      setLoadBusy(false)
    }
  }, [supabase, metric, t])

  useEffect(() => {
    if (!metric) {
      setTrend(null)
      setLoadError(null)
      setTableMissing(false)
      return
    }
    const id = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(id)
  }, [load, metric])

  return { trend, loadBusy, loadError, tableMissing, reload: load }
}
