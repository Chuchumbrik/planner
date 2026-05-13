import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Session } from '@supabase/supabase-js'
import { motivatorAppRole, type MotivatorAppRole } from '@/lib/motivatorRole'
import { supabase } from '@/lib/supabase'

type RoleNotice = {
  kind: 'role'
  before: MotivatorAppRole
  after: MotivatorAppRole
}

const THROTTLE_MS = 25_000

function roleLabel(t: (k: string) => string, role: MotivatorAppRole): string {
  if (role === 'admin') return t('shell.roleLabelAdmin')
  if (role === 'beta_tester') return t('shell.roleLabelBetaTester')
  return t('shell.roleLabelUser')
}

/**
 * При возврате на вкладку / фокусе окна обновляет сессию Supabase и показывает баннер,
 * если на сервере сменился `motivator_role` (например правкой в Dashboard), пока вкладка была в фоне.
 */
export function SessionSyncInformer({ session }: { session: Session }) {
  const { t } = useTranslation()
  const [notice, setNotice] = useState<RoleNotice | null>(null)
  const dismissedKeyRef = useRef<string | null>(null)
  const lastRefreshAtRef = useRef(0)
  const mountedRef = useRef(false)

  const trySync = useCallback(async () => {
    if (!supabase) return
    const now = Date.now()
    if (now - lastRefreshAtRef.current < THROTTLE_MS) return
    lastRefreshAtRef.current = now

    const roleBefore = motivatorAppRole(session)
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.session) return

    const roleAfter = motivatorAppRole(data.session)
    if (roleBefore === roleAfter) return

    const key = `${roleBefore}>${roleAfter}`
    if (dismissedKeyRef.current === key) return
    setNotice({ kind: 'role', before: roleBefore, after: roleAfter })
  }, [session])

  useEffect(() => {
    const run = () => {
      if (document.visibilityState !== 'visible') return
      void trySync()
    }
    const onFocus = () => void trySync()

    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', onFocus)

    if (!mountedRef.current) {
      mountedRef.current = true
      window.setTimeout(() => void trySync(), 0)
    }

    return () => {
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', onFocus)
    }
  }, [trySync])

  useEffect(() => {
    dismissedKeyRef.current = null
    setNotice(null)
  }, [session.user.id])

  if (!notice) return null

  const detail = t('shell.sessionInformerRoleDetail', {
    before: roleLabel(t, notice.before),
    after: roleLabel(t, notice.after),
  })

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] border-b border-emerald-800/60 bg-emerald-950/95 px-4 py-2.5 text-center text-sm text-emerald-100 shadow-lg backdrop-blur-sm"
      role="status"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-4">
        <p>
          <span className="font-medium">{t('shell.sessionInformerRoleTitle')}</span>{' '}
          <span className="text-emerald-200/90">{detail}</span>
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md border border-emerald-700/80 px-2.5 py-1 text-xs text-emerald-100 hover:bg-emerald-900/80"
          onClick={() => {
            dismissedKeyRef.current = `${notice.before}>${notice.after}`
            setNotice(null)
          }}
        >
          {t('shell.sessionInformerDismiss')}
        </button>
      </div>
    </div>
  )
}
