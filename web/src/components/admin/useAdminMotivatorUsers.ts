import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MotivatorRoleRow } from '@/components/AdminMotivatorRolePanel'
import { parseMotivatorRoleListResponse } from '@/lib/adminMotivatorRolesList'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'

const ADMIN_ROLES_FN = 'admin-motivator-roles'

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
] as const

export function mapAdminRolesError(formatted: string, t: (key: string) => string): string {
  for (const code of ERROR_CODES) {
    if (formatted.includes(code)) {
      return t(`settings.adminRolesErrors.${code}`)
    }
  }
  return formatted
}

export function useAdminMotivatorUsers(supabase: SupabaseClient | null) {
  const { t } = useTranslation()
  const [users, setUsers] = useState<MotivatorRoleRow[]>([])
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoadError(null)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'list', search: '' },
      })
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, t))
        return
      }
      const raw = data && typeof data === 'object' && 'users' in data ? (data as { users?: unknown }).users : null
      const next = parseMotivatorRoleListResponse(raw)
      if (!next) {
        setLoadError(t('settings.adminRolesErrors.list_failed'))
        return
      }
      setUsers(next)
    } catch (e: unknown) {
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
    } finally {
      setLoadBusy(false)
    }
  }, [supabase, t])

  useEffect(() => {
    if (!supabase) return
    const id = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(id)
  }, [load, supabase])

  return { users, setUsers, loadBusy, loadError, load, setLoadError }
}
