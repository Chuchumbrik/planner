import type { DiscussionStatus } from '@/lib/discussionsApi'

/**
 * Visual meta for discussion status chips — colours / icons / i18n label keys.
 * Source: `obsidian-motivator/20-Phase-7-План-краткой-сводки.md` §8.4.
 * `pending-journal` carries `animate-pulse` to draw attention to threads awaiting
 * a journal sync (§8.6).
 */
export type DiscussionStatusMeta = { chipClass: string; icon: string; labelKey: string }

export const DISCUSSION_STATUS_META: Record<DiscussionStatus, DiscussionStatusMeta> = {
  open: {
    chipClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    icon: 'chat_bubble',
    labelKey: 'admin.discussions.statusOpen',
  },
  'pending-journal': {
    chipClass: 'text-amber-300 bg-amber-500/15 border-amber-500/30 animate-pulse',
    icon: 'sync_problem',
    labelKey: 'admin.discussions.statusPending',
  },
  synced: {
    chipClass: 'text-on-surface-variant/60 bg-surface-variant/20 border-surface-variant/40',
    icon: 'check_circle',
    labelKey: 'admin.discussions.statusSynced',
  },
  archived: {
    chipClass: 'text-on-surface-variant/40 bg-zinc-500/10 border-zinc-500/20',
    icon: 'archive',
    labelKey: 'admin.discussions.statusArchived',
  },
}
