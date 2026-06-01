import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useLatestRef } from '@/components/admin/useAbortableInvoke'
import { invokeDiscussionsFn, type Discussion, type DiscussionReply } from '@/lib/discussionsApi'

/**
 * Loads a single discussion thread (`action: 'get'`): discussion + replies +
 * subscription state. On a successful load it fires `mark-read`
 * fire-and-forget (no UI wait, errors only `console.warn`).
 */
export function useDiscussionThread(supabase: SupabaseClient | null, id: string | null) {
  const { t } = useTranslation()
  const tRef = useLatestRef(t)
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [replies, setReplies] = useState<DiscussionReply[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const [loadBusy, setLoadBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!supabase || !id) return
      const tr = tRef.current
      setLoadError(null)
      setLoadBusy(true)
      try {
        const result = await invokeDiscussionsFn(supabase, { action: 'get', discussionId: id }, signal)
        if (!result) return
        if ('error' in result) {
          const notFound = result.error.includes('not_found')
          setLoadError(notFound ? tr('admin.discussions.notFound') : result.error || tr('admin.discussions.loadError'))
          return
        }
        const d = (result.raw.discussion as Discussion | undefined) ?? null
        setDiscussion(d)
        setReplies(Array.isArray(result.raw.replies) ? (result.raw.replies as DiscussionReply[]) : [])
        setSubscribed(result.raw.subscribed === true)
        // mark-read fire-and-forget — never blocks the thread view.
        if (d) {
          void invokeDiscussionsFn(supabase, { action: 'mark-read', discussionId: id }).catch((e) => {
            console.warn('mark-read failed', e)
          })
        }
      } finally {
        if (!signal?.aborted) setLoadBusy(false)
      }
    },
    [supabase, id, tRef],
  )

  useEffect(() => {
    if (!supabase || !id) {
      setDiscussion(null)
      setReplies([])
      setSubscribed(false)
      return
    }
    const ctrl = new AbortController()
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load, supabase, id])

  const reload = useCallback(() => void load(), [load])

  return { discussion, replies, subscribed, loadBusy, loadError, reload }
}
