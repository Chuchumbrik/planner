import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { ADMIN_ROLES_FN } from '@/lib/adminMonitoringConstants'
import { parseAdminActivityDayDetailResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminActivityDayDetail } from '@/types/adminMonitoring'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { useLatestRef } from '@/components/admin/useAbortableInvoke'

export function useAdminActivityDayUsers(
  supabase: SupabaseClient | null,
  date: string | null,
  role: ActivityChartRoleFilter,
) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const [detail, setDetail] = useState<AdminActivityDayDetail | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase || !date) {
      setDetail(null)
      return
    }
    const tr = tRef.current
    setLoadError(null)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'activityDayUsers', date, role },
        signal,
      })
      if (signal?.aborted) return
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, tr))
        setDetail(null)
        return
      }
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const parsed = parseAdminActivityDayDetailResponse(body?.detail)
      if (!parsed) {
        setLoadError(tr('settings.adminRolesErrors.activity_day_users_failed'))
        setDetail(null)
        return
      }
      setDetail(parsed)
    } catch (e: unknown) {
      if (signal?.aborted) return
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), tr))
      setDetail(null)
    } finally {
      if (!signal?.aborted) setLoadBusy(false)
    }
  }, [supabase, date, role, tRef])

  useEffect(() => {
    if (!date) {
      setDetail(null)
      setLoadError(null)
      return
    }
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, date])

  return { detail, loadBusy, loadError, reload: load }
}
