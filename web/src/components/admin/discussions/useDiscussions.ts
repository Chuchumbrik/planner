import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useLatestRef } from '@/components/admin/useAbortableInvoke'
import { invokeDiscussionsFn, type Discussion } from '@/lib/discussionsApi'

/**
 * Loads the discussion list (`action: 'list'`). Backend already sorts and
 * computes `unread`; we keep the order as returned. Mirrors the
 * data-hook pattern in `useAdminOverview.ts`.
 */
export function useDiscussions(supabase: SupabaseClient | null) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!supabase) return
      const tr = tRef.current
      setLoadError(null)
      setLoadBusy(true)
      try {
        const result = await invokeDiscussionsFn(supabase, { action: 'list' }, signal)
        if (!result) return
        if ('error' in result) {
          setLoadError(result.error || tr('admin.discussions.loadError'))
          return
        }
        const list = Array.isArray(result.raw.discussions)
          ? (result.raw.discussions as Discussion[])
          : []
        setDiscussions(list)
      } finally {
        if (!signal?.aborted) setLoadBusy(false)
      }
    },
    [supabase, tRef],
  )

  useEffect(() => {
    if (!supabase) return
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, supabase])

  const reload = useCallback(() => void load(), [load])

  return { discussions, loadBusy, loadError, reload }
}
