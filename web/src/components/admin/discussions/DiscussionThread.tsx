import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AiMarkdown } from '@/components/ai/AiMarkdown'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { MOTIVATOR_INPUT, SETTINGS_BTN_SECONDARY } from '@/lib/designClasses'
import { invokeDiscussionsFn, type Discussion, type DiscussionReply } from '@/lib/discussionsApi'
import { DiscussionReplyItem } from './DiscussionReplyItem'
import { DiscussionStatusChip } from './DiscussionStatusChip'

interface Props {
  discussion: Discussion
  replies: DiscussionReply[]
  loadBusy: boolean
  supabase: SupabaseClient
  onBack: () => void
  /** Reload thread + list after a mutation (reply / archive / status change). */
  onChanged: () => void
  onResolveClick: () => void
  onSyncClick: () => void
}

export function DiscussionThread({
  discussion,
  replies,
  loadBusy,
  supabase,
  onBack,
  onChanged,
  onResolveClick,
  onSyncClick,
}: Props) {
  const { t } = useTranslation()
  const [replyBody, setReplyBody] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const canReply = replyBody.trim() !== '' && !replyBusy

  async function submitReply() {
    if (!canReply) return
    setReplyBusy(true)
    setError(null)
    const result = await invokeDiscussionsFn(supabase, {
      action: 'reply',
      discussionId: discussion.id,
      body: replyBody.trim(),
    })
    setReplyBusy(false)
    if (!result) return
    if ('error' in result) {
      setError(result.error)
      return
    }
    setReplyBody('')
    onChanged()
  }

  async function archive() {
    setActionBusy(true)
    setError(null)
    const result = await invokeDiscussionsFn(supabase, { action: 'archive', discussionId: discussion.id })
    setActionBusy(false)
    setConfirmArchive(false)
    if (!result) return
    if ('error' in result) {
      setError(result.error)
      return
    }
    onChanged()
  }

  function onReplyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      void submitReply()
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <MaterialIcon name="arrow_back" size={16} />
        {t('admin.discussions.back')}
      </button>

      <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 p-sm md:p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-title-md font-semibold text-on-surface">{discussion.title}</h3>
          <DiscussionStatusChip status={discussion.status} className="shrink-0" />
        </div>
        {discussion.body ? <AiMarkdown text={discussion.body} /> : null}
      </div>

      {discussion.status === 'pending-journal' ? (
        <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
          <p className="text-body-sm font-medium text-amber-300">
            {t('admin.discussions.pendingJournalHint')}
          </p>
          {discussion.resolution_summary ? (
            <div className="rounded border border-amber-400/20 bg-surface-container-lowest/60 p-2">
              <AiMarkdown text={discussion.resolution_summary} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        {replies.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant/60">{t('admin.discussions.noReplies')}</p>
        ) : (
          replies.map((r) => <DiscussionReplyItem key={r.id} reply={r} />)
        )}
      </div>

      {error ? <p className="text-body-sm text-amber-300">{error}</p> : null}

      {discussion.status !== 'archived' ? (
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-label-sm text-on-surface-variant">
              {t('admin.discussions.reply')}
            </span>
            <textarea
              className={cn(MOTIVATOR_INPUT, 'min-h-[5rem] resize-y')}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={onReplyKeyDown}
              placeholder={t('admin.discussions.replyPlaceholder')}
              disabled={replyBusy}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              className={cn(
                SETTINGS_BTN_SECONDARY,
                'border-primary/40 text-primary hover:bg-primary/10',
                !canReply && 'opacity-50',
              )}
              onClick={() => void submitReply()}
              disabled={!canReply}
            >
              {replyBusy ? t('common.loading') : t('admin.discussions.replySubmit')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-surface-variant pt-3">
        {discussion.status === 'open' ? (
          <button
            type="button"
            className={cn(SETTINGS_BTN_SECONDARY, 'flex items-center gap-1.5 border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10')}
            onClick={onResolveClick}
            disabled={actionBusy || loadBusy}
          >
            <MaterialIcon name="task_alt" size={16} />
            {t('admin.discussions.resolve')}
          </button>
        ) : null}

        {discussion.status === 'pending-journal' ? (
          <button
            type="button"
            className={cn(SETTINGS_BTN_SECONDARY, 'flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10')}
            onClick={onSyncClick}
            disabled={actionBusy || loadBusy}
          >
            <MaterialIcon name="check_circle" size={16} />
            {t('admin.discussions.markSynced')}
          </button>
        ) : null}

        {discussion.status !== 'archived' ? (
          confirmArchive ? (
            <span className="flex items-center gap-2">
              <span className="text-body-sm text-on-surface-variant">{t('admin.discussions.archiveConfirm')}</span>
              <button
                type="button"
                className={cn(SETTINGS_BTN_SECONDARY, 'border-amber-400/40 text-amber-300 hover:bg-amber-400/10')}
                onClick={() => void archive()}
                disabled={actionBusy}
              >
                {actionBusy ? t('common.loading') : t('common.confirm')}
              </button>
              <button
                type="button"
                className={SETTINGS_BTN_SECONDARY}
                onClick={() => setConfirmArchive(false)}
                disabled={actionBusy}
              >
                {t('common.cancel')}
              </button>
            </span>
          ) : (
            <button
              type="button"
              className={cn(SETTINGS_BTN_SECONDARY, 'flex items-center gap-1.5')}
              onClick={() => setConfirmArchive(true)}
              disabled={actionBusy || loadBusy}
            >
              <MaterialIcon name="archive" size={16} />
              {t('admin.discussions.archive')}
            </button>
          )
        ) : null}
      </div>
    </div>
  )
}
