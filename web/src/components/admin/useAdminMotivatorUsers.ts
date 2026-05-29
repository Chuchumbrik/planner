import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseMotivatorRoleListResponse } from '@/lib/adminMotivatorRolesList'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { ADMIN_ROLES_FN } from '@/lib/adminMonitoringConstants'
import { useLatestRef } from '@/components/admin/useAbortableInvoke'

const ERROR_CODES = [
  'forbidden',
  'missing_authorization',
  'invalid_token',
  'supabase_env_missing',
  'role_lookup_failed',
  'invalid_body',
  'invalid_role',
  'user_not_found',
  'update_failed',
  'list_failed',
  'overview_failed',
  'kpi_trend_failed',
  'activity_chart_failed',
  'activity_day_users_failed',
  'activity_table_missing',
] as const

export function mapAdminRolesError(formatted: string, t: (key: string) => string): string {
  for (const code of ERROR_CODES) {
    if (formatted.includes(code)) {
      return t(`settings.adminRolesErrors.${code}`)
    }
  }
  return formatted
}

export function useAdminMotivatorUsers(
  supabase: SupabaseClient | null,
  options?: { enabled?: boolean },
) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const enabled = options?.enabled ?? true
  const [users, setUsers] = useState<MotivatorRoleRow[]>([])
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listDegraded, setListDegraded] = useState(false)
  // remembers which supabase instance was last successfully loaded — skip
  // re-fetching on every tab toggle but rebind if the client itself changes.
  const loadedForClient = useRef<SupabaseClient | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase) return
    const tr = tRef.current
    setLoadError(null)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'list' },
        signal,
      })
      if (signal?.aborted) return
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, tr))
        return
      }
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const raw = body?.users
      const next = parseMotivatorRoleListResponse(raw)
      if (!next) {
        setLoadError(tr('settings.adminRolesErrors.list_failed'))
        return
      }
      setUsers(next)
      setListDegraded(body?.list_degraded === true)
      loadedForClient.current = supabase
    } catch (e: unknown) {
      if (signal?.aborted) return
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), tr))
    } finally {
      if (!signal?.aborted) setLoadBusy(false)
    }
  }, [supabase, tRef])

  useEffect(() => {
    if (!enabled || !supabase) return
    if (loadedForClient.current === supabase) return
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, supabase, enabled])

  return { users, setUsers, loadBusy, loadError, listDegraded, load, setLoadError }
}
