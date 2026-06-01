import type { SupabaseClient } from '@supabase/supabase-js'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'

/** Edge function name for admin discussions (Phase 7.8 backend). */
export const DISCUSSIONS_FN = 'admin-discussions'

/**
 * True when an error string comes from a `409 bad_status` Edge response — i.e.
 * the thread's status changed underneath the user (e.g. resolved/synced in
 * another tab) so the attempted transition no longer applies. Callers surface a
 * friendly "refresh and retry" message instead of the raw backend error.
 */
export function isStaleStatusError(message: string | null | undefined): boolean {
  return typeof message === 'string' && message.includes('bad_status')
}

export type DiscussionStatus = 'open' | 'pending-journal' | 'synced' | 'archived'

/**
 * A discussion thread row. Shape mirrors the `admin_discussions` table /
 * `admin-discussions` Edge responses. `list` returns a projection that includes
 * `body` (used for the list preview line); `get` returns the full row (`select *`).
 */
export interface Discussion {
  id: string
  title: string
  status: DiscussionStatus
  created_at: string
  updated_at: string
  reply_count: number
  last_reply_at: string | null
  linked_journal_entry: string | null
  linked_version: string | null
  unread?: boolean
  body?: string
  resolution_summary?: string | null
  created_by?: string
}

export interface DiscussionReply {
  id: string
  body: string
  created_at: string
  created_by: string
}

/**
 * Shared invocation helper for the `admin-discussions` Edge function — mirrors
 * `invokeAdminFn` (useAbortableInvoke.ts) but bound to {@link DISCUSSIONS_FN}.
 * Kept separate to avoid touching the existing admin-roles helper.
 */
export async function invokeDiscussionsFn(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ raw: Record<string, unknown> } | { error: string } | null> {
  try {
    const { data, error: fnErr } = await supabase.functions.invoke(DISCUSSIONS_FN, { body, signal })
    if (signal?.aborted) return null
    if (fnErr) return { error: await formatSupabaseFunctionInvokeError(fnErr) }
    const raw = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return { raw }
  } catch (e: unknown) {
    if (signal?.aborted) return null
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
