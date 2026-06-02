import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { invokeDiscussionsFn, type Discussion } from '@/lib/discussionsApi'
import { supabase } from '@/lib/supabase'

/** Как часто перепроверять счётчик непрочитанных, пока вкладка открыта. */
const POLL_INTERVAL_MS = 60_000

/**
 * Phase 7.10 — счётчик непрочитанных обсуждений. Берёт `supabase` синглтон
 * напрямую (как `AdminDiscussionsPage`), поэтому не требует props. Когда supabase
 * не настроен или непрочитанных нет — рендерит `null`.
 *
 * Счётчик «живой»: опрашивается на mount, по таймеру раз в минуту и при
 * возврате фокуса на вкладку. При росте счётчика проигрывает короткую
 * bell-shake анимацию (если не включён `prefers-reduced-motion`).
 */
export function UnreadDiscussionsBadge() {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  const [shake, setShake] = useState(false)
  const prevCount = useRef(0)

  const fetchUnread = useCallback(async (signal?: AbortSignal) => {
    if (!supabase) return
    const result = await invokeDiscussionsFn(supabase, { action: 'list' }, signal)
    if (!result || 'error' in result) return
    const list = Array.isArray(result.raw.discussions) ? (result.raw.discussions as Discussion[]) : []
    setCount(list.filter((d) => d.unread).length)
  }, [])

  useEffect(() => {
    if (!supabase) return
    const ctrl = new AbortController()
    void fetchUnread(ctrl.signal)

    const interval = window.setInterval(() => void fetchUnread(), POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchUnread()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      ctrl.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchUnread])

  useEffect(() => {
    if (count > prevCount.current && count > 0) {
      setShake(true)
      const id = window.setTimeout(() => setShake(false), 700)
      prevCount.current = count
      return () => window.clearTimeout(id)
    }
    prevCount.current = count
  }, [count])

  if (!supabase || count <= 0) return null

  return (
    <span
      aria-label={t('admin.discussions.notifyBadgeAria', { count })}
      className={cn(
        'pointer-events-none absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold leading-[1.1rem] text-on-primary',
        shake && 'animate-bell-shake',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
