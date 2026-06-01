import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseMotivatorRoleListResponse } from '@/lib/adminMotivatorRolesList'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import { invokeAdminFn, useLatestRef } from '@/components/admin/useAbortableInvoke'

const ERROR_CODES = [
  'forbidden',
  'missing_authorization',
  'invalid_token',
  'supabase_env_missing',
  'role_lookup_failed',
  'invalid_body',
  'invalid_role',
  'role_conflict',
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
  const [degradedTables, setDegradedTables] = useState<string[]>([])
  const loadedForClient = useRef<SupabaseClient | null>(null)
  const loadedAt = useRef<number>(0)
  const STALE_MS = 5 * 60 * 1000

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!supabase) return
    const tr = tRef.current
    setLoadError(null)
    setLoadBusy(true)
    try {
      const result = await invokeAdminFn(supabase, { action: 'list' }, signal)
      if (!result) return
      if ('error' in result) {
        setLoadError(mapAdminRolesError(result.error, tr))
        return
      }
      const next = parseMotivatorRoleListResponse(result.raw.users)
      if (!next) {
        setLoadError(tr('settings.adminRolesErrors.list_failed'))
        return
      }
      setUsers(next)
      setListDegraded(result.raw.list_degraded === true)
      setDegradedTables(Array.isArray(result.raw.degraded_tables) ? (result.raw.degraded_tables as string[]) : [])
      loadedForClient.current = supabase
      loadedAt.current = Date.now()
    } finally {
      if (!signal?.aborted) setLoadBusy(false)
    }
  }, [supabase, tRef])

  useEffect(() => {
    if (!enabled || !supabase) return
    const isStale = Date.now() - loadedAt.current > STALE_MS
    if (loadedForClient.current === supabase && !isStale) return
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, supabase, enabled, STALE_MS])

  return { users, setUsers, loadBusy, loadError, listDegraded, degradedTables, load, setLoadError }
}
