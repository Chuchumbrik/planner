import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { parseAdminActivityDayDetailResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminActivityDayDetail } from '@/types/adminMonitoring'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'

const ADMIN_ROLES_FN = 'admin-motivator-roles'

export function useAdminActivityDayUsers(
  supabase: SupabaseClient | null,
  date: string | null,
  role: ActivityChartRoleFilter,
) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<AdminActivityDayDetail | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase || !date) {
      setDetail(null)
      return
    }
    setLoadError(null)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'activityDayUsers', date, role },
      })
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, t))
        setDetail(null)
        return
      }
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const parsed = parseAdminActivityDayDetailResponse(body?.detail)
      if (!parsed) {
        setLoadError(t('settings.adminRolesErrors.activity_day_users_failed'))
        setDetail(null)
        return
      }
      setDetail(parsed)
    } catch (e: unknown) {
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
      setDetail(null)
    } finally {
      setLoadBusy(false)
    }
  }, [supabase, date, role, t])

  useEffect(() => {
    if (!date) {
      setDetail(null)
      setLoadError(null)
      return
    }
    const id = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(id)
  }, [load, date])

  return { detail, loadBusy, loadError, reload: load }
}
