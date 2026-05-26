import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseAdminOverviewResponse } from '@/lib/adminMotivatorRolesList'
import type { AdminOverview } from '@/types/adminMonitoring'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { mapAdminRolesError } from '@/components/admin/useAdminMotivatorUsers'

const ADMIN_ROLES_FN = 'admin-motivator-roles'

export function useAdminOverview(supabase: SupabaseClient | null) {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listDegraded, setListDegraded] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoadError(null)
    setLoadBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'overview' },
      })
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, t))
        return
      }
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const parsed = parseAdminOverviewResponse(body?.overview)
      if (!parsed) {
        setLoadError(t('settings.adminRolesErrors.overview_failed'))
        return
      }
      setOverview(parsed)
      setListDegraded(body?.list_degraded === true)
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

  return { overview, loadBusy, loadError, listDegraded, load, setLoadError }
}
