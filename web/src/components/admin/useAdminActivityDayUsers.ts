import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityChartRoleFilter } from '@/lib/adminMonitoringConstants'
import { parseAdminActivityDayDetailResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminActivityDayDetail } from '@/types/adminMonitoring'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { invokeAdminFn, useLatestRef } from '@/components/admin/useAbortableInvoke'

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
      const result = await invokeAdminFn(supabase, { action: 'activityDayUsers', date, role }, signal)
      if (!result) return
      if ('error' in result) {
        setLoadError(mapAdminRolesError(result.error, tr))
        setDetail(null)
        return
      }
      const parsed = parseAdminActivityDayDetailResponse(result.raw.detail)
      if (!parsed) {
        setLoadError(tr('settings.adminRolesErrors.activity_day_users_failed'))
        setDetail(null)
        return
      }
      setDetail(parsed)
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
