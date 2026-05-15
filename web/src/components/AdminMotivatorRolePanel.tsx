import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'

export type MotivatorRoleRow = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  motivator_role: 'admin' | 'beta_tester' | 'user'
}

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

function mapAdminRolesError(formatted: string, t: (key: string) => string): string {
  for (const code of ERROR_CODES) {
    if (formatted.includes(code)) {
      return t(`settings.adminRolesErrors.${code}`)
    }
  }
  return formatted
}

export function AdminMotivatorRolePanel({
  supabase,
  currentUserId,
}: {
  supabase: SupabaseClient
  currentUserId: string | undefined
}) {
  const { t } = useTranslation()
  const [users, setUsers] = useState<MotivatorRoleRow[]>([])
  const [search, setSearch] = useState('')
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rowBusyId, setRowBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
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
      if (!Array.isArray(raw)) {
        setLoadError(t('settings.adminRolesErrors.list_failed'))
        return
      }
      const next: MotivatorRoleRow[] = []
      for (const item of raw) {
        if (!item || typeof item !== 'object') continue
        const o = item as Record<string, unknown>
        const id = typeof o.id === 'string' ? o.id : ''
        const email = typeof o.email === 'string' ? o.email : ''
        const created_at = typeof o.created_at === 'string' ? o.created_at : ''
        const last_sign_in_at =
          o.last_sign_in_at === null ? null : typeof o.last_sign_in_at === 'string' ? o.last_sign_in_at : null
        const r = o.motivator_role
        const motivator_role =
          r === 'admin' || r === 'beta_tester' || r === 'user' ? r : ('user' as const)
        if (id) next.push({ id, email, created_at, last_sign_in_at, motivator_role })
      }
      setUsers(next)
    } catch (e: unknown) {
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
    } finally {
      setLoadBusy(false)
    }
  }, [supabase, t])

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(id)
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
  }, [users, search])

  async function applyRole(
    user: MotivatorRoleRow,
    role: MotivatorRoleRow['motivator_role'],
  ) {
    if (role === user.motivator_role) return
    if (user.id === currentUserId && user.motivator_role === 'admin' && role !== 'admin') {
      if (!window.confirm(t('settings.adminRolesConfirmSelfDemote'))) return
      if (!window.confirm(t('settings.adminRolesConfirmSelfDemoteAgain'))) return
    } else if (user.id !== currentUserId) {
      const label = t(`settings.adminRolesOption${role === 'admin' ? 'Admin' : role === 'beta_tester' ? 'Beta' : 'User'}`)
      if (!window.confirm(t('settings.adminRolesConfirmChange', { email: user.email || user.id, role: label }))) {
        return
      }
    }
    setLoadError(null)
    setRowBusyId(user.id)
    const userId = user.id
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(ADMIN_ROLES_FN, {
        body: { action: 'setRole', userId, role },
      })
      if (fnErr) {
        await load()
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setLoadError(mapAdminRolesError(msg, t))
        return
      }
      if (!data || typeof data !== 'object' || !('ok' in data) || !(data as { ok?: unknown }).ok) {
        await load()
        setLoadError(t('settings.adminRolesErrors.update_failed'))
        return
      }
      await load()
      if (userId === currentUserId) {
        await supabase.auth.refreshSession()
      }
    } catch (e: unknown) {
      await load()
      setLoadError(mapAdminRolesError(e instanceof Error ? e.message : String(e), t))
    } finally {
      setRowBusyId(null)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-zinc-300">{t('settings.adminRolesTitle')}</h2>
      <p className="mt-2 text-xs text-zinc-500">{t('settings.adminRolesHelp')}</p>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          autoComplete="off"
          placeholder={t('settings.adminRolesSearchPlaceholder')}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          disabled={loadBusy}
          className="shrink-0 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
          onClick={() => void load()}
        >
          {loadBusy ? t('common.loading') : t('settings.adminRolesRefresh')}
        </button>
      </div>

      {loadError ? (
        <p className="mt-3 text-xs text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-amber-600/85">{t('settings.adminRolesSelfHint')}</p>

      <div className="mt-4 flex flex-col gap-2 md:hidden">
        {filtered.length === 0 && !loadBusy ? (
          <p className="rounded-lg border border-zinc-800 px-3 py-6 text-center text-xs text-zinc-500">
            {t('settings.adminRolesEmpty')}
          </p>
        ) : null}
        {filtered.map((u) => {
          const busy = rowBusyId === u.id
          return (
            <div key={u.id} className="rounded-lg border border-zinc-700/80 bg-zinc-950/60 px-3 py-3">
              <div className="min-w-0 break-all text-sm text-zinc-200">{u.email || u.id}</div>
              {u.id === currentUserId ? (
                <div className="mt-0.5 text-[10px] text-zinc-600">{t('settings.adminRolesYou')}</div>
              ) : null}
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {t('settings.adminRolesColRole')}
                </span>
                <select
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-40"
                  value={u.motivator_role}
                  disabled={busy || loadBusy}
                  onChange={(e) => {
                    const v = e.target.value as MotivatorRoleRow['motivator_role']
                    if (v === u.motivator_role) return
                    void applyRole(u, v)
                  }}
                >
                  <option value="user">{t('settings.adminRolesOptionUser')}</option>
                  <option value="beta_tester">{t('settings.adminRolesOptionBeta')}</option>
                  <option value="admin">{t('settings.adminRolesOptionAdmin')}</option>
                </select>
              </label>
            </div>
          )
        })}
      </div>

        <div className="mt-4 hidden overflow-x-auto rounded-lg border border-zinc-700/80 bg-zinc-950/40 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2 font-medium">{t('settings.adminRolesColEmail')}</th>
              <th className="px-3 py-2 font-medium">{t('settings.adminRolesColRole')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loadBusy ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-xs text-zinc-500">
                  {t('settings.adminRolesEmpty')}
                </td>
              </tr>
            ) : null}
            {filtered.map((u) => {
              const busy = rowBusyId === u.id
              return (
                <tr key={u.id} className="border-b border-zinc-800/80 last:border-0">
                  <td className="max-w-[14rem] px-3 py-2 align-middle">
                    <div className="truncate text-zinc-200" title={u.email || u.id}>
                      {u.email || u.id}
                    </div>
                    {u.id === currentUserId ? (
                      <div className="text-[10px] text-zinc-600">{t('settings.adminRolesYou')}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <select
                      className="w-full max-w-[11rem] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-40"
                      value={u.motivator_role}
                      disabled={busy || loadBusy}
                      onChange={(e) => {
                        const v = e.target.value as MotivatorRoleRow['motivator_role']
                        if (v === u.motivator_role) return
                        void applyRole(u, v)
                      }}
                    >
                      <option value="user">{t('settings.adminRolesOptionUser')}</option>
                      <option value="beta_tester">{t('settings.adminRolesOptionBeta')}</option>
                      <option value="admin">{t('settings.adminRolesOptionAdmin')}</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  )
}
