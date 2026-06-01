import type { Discussion, DiscussionStatus } from '@/lib/discussionsApi'

/**
 * Pure sorting / unread logic for discussion threads (Phase 7.9).
 * No React/i18n deps — unit-tested. Mirrors the backend ordering in
 * `admin-discussions/index.ts` so optimistic client re-sorts stay consistent.
 */

/** Status ordering: open → pending-journal → synced → archived. */
export const DISCUSSION_STATUS_RANK: Record<DiscussionStatus, number> = {
  open: 0,
  'pending-journal': 1,
  synced: 2,
  archived: 3,
}

type SortableDiscussion = Pick<Discussion, 'status' | 'last_reply_at' | 'created_at'>

/**
 * Sort by status rank, then by most-recent activity (`last_reply_at`, falling
 * back to `created_at`) descending. Returns a new array; input is not mutated.
 */
export function sortDiscussions<T extends SortableDiscussion>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => {
    const r = (DISCUSSION_STATUS_RANK[a.status] ?? 9) - (DISCUSSION_STATUS_RANK[b.status] ?? 9)
    if (r !== 0) return r
    return String(b.last_reply_at ?? b.created_at).localeCompare(String(a.last_reply_at ?? a.created_at))
  })
}

/**
 * A thread is unread when it has activity (`last_reply_at`) the viewer hasn't
 * seen — no read marker, or a read marker older than the last reply.
 */
export function computeUnread(lastReplyAt: string | null, lastReadAt: string | null): boolean {
  if (!lastReplyAt) return false
  if (!lastReadAt) return true
  return lastReplyAt > lastReadAt
}
