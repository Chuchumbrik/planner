import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseAdminOverviewResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminOverview } from '@/types/adminMonitoring'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'
import { invokeAdminFn, useLatestRef } from '@/components/admin/useAbortableInvoke'

export function useAdminOverview(supabase: SupabaseClient | null) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listDegraded, setListDegraded] = useState(false)
  const [degradedTables, setDegradedTables] = useState<string[]>([])
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase) return
    const tr = tRef.current
    setLoadError(null)
    setLoadBusy(true)
    try {
      const result = await invokeAdminFn(supabase, { action: 'overview' }, signal)
      if (!result) return
      if ('error' in result) {
        setLoadError(mapAdminRolesError(result.error, tr))
        return
      }
      const parsed = parseAdminOverviewResponse(result.raw.overview)
      if (!parsed) {
        setLoadError(tr('settings.adminRolesErrors.overview_failed'))
        return
      }
      setOverview(parsed)
      setListDegraded(result.raw.list_degraded === true)
      setDegradedTables(Array.isArray(result.raw.degraded_tables) ? (result.raw.degraded_tables as string[]) : [])
      setLastLoaded(new Date())
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

  return { overview, loadBusy, loadError, listDegraded, degradedTables, lastLoaded, load, setLoadError }
}
