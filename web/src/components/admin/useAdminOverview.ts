import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseAdminOverviewResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminOverview } from '@/types/adminMonitoring'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { ADMIN_ROLES_FN } from '@/lib/adminMonitoringConstants'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { useLatestRef } from '@/components/admin/useAbortableInvoke'

export function useAdminOverview(supabase: SupabaseClient | null) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listDegraded, setListDegraded] = useState(false)
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase) return
    const tr = tRef.current
    setLoadError(null)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'overview' },
        signal,
      })
      if (signal?.aborted) return
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, tr))
        return
      }
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const parsed = parseAdminOverviewResponse(body?.overview)
      if (!parsed) {
        setLoadError(tr('settings.adminRolesErrors.overview_failed'))
        return
      }
      setOverview(parsed)
      setListDegraded(body?.list_degraded === true)
      setLastLoaded(new Date())
    } catch (e: unknown) {
      if (signal?.aborted) return
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), tr))
    } finally {
      if (!signal?.aborted) setLoadBusy(false)
    }
  }, [supabase, tRef])

  useEffect(() => {
    if (!supabase) return
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, supabase])

  return { overview, loadBusy, loadError, listDegraded, lastLoaded, load, setLoadError }
}
