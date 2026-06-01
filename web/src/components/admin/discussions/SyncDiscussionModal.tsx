import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  MODAL_CLOSE_BTN,
  MODAL_FOOTER,
  MODAL_HEADER,
  MODAL_OVERLAY,
  MODAL_SHELL,
  MODAL_TITLE,
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
} from '@/lib/designClasses'
import { invokeDiscussionsFn, isStaleStatusError, type Discussion } from '@/lib/discussionsApi'

interface Props {
  discussionId: string
  supabase: SupabaseClient
  onSynced: (d: Discussion) => void
  onClose: () => void
}

/** Sync modal: pending-journal → synced, records the journal entry id (DR-XXX). */
export function SyncDiscussionModal({ discussionId, supabase, onSynced, onClose }: Props) {
  const { t } = useTranslation()
  const [journalEntry, setJournalEntry] = useState('')
  const [linkedVersion, setLinkedVersion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = journalEntry.trim() !== '' && !busy

  async function submit() {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    const result = await invokeDiscussionsFn(supabase, {
      action: 'mark-synced',
      discussionId,
      linkedJournalEntry: journalEntry.trim(),
      ...(linkedVersion.trim() ? { linkedVersion: linkedVersion.trim() } : {}),
    })
    setBusy(false)
    if (!result) return
    if ('error' in result) {
      setError(isStaleStatusError(result.error) ? t('admin.discussions.staleStatus') : result.error)
      return
    }
    const updated = result.raw.discussion as Discussion | undefined
    if (updated) onSynced(updated)
  }

  return (
    <div className={MODAL_OVERLAY} onClick={busy ? undefined : onClose}>
      <div className={MODAL_SHELL} onClick={(e) => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className={MODAL_TITLE}>{t('admin.discussions.markSyncedTitle')}</h2>
          <button type="button" className={MODAL_CLOSE_BTN} onClick={onClose} disabled={busy}>
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-sm md:p-md">
          <label className="block">
            <span className="mb-1 block text-label-sm text-on-surface-variant">
              {t('admin.discussions.linkedJournalEntry')}
            </span>
            <input
              type="text"
              className={MOTIVATOR_INPUT}
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder={t('admin.discussions.linkedJournalEntryPlaceholder')}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-sm text-on-surface-variant">
              {t('admin.discussions.linkedVersion')}
            </span>
            <input
              type="text"
              className={MOTIVATOR_INPUT}
              value={linkedVersion}
              onChange={(e) => setLinkedVersion(e.target.value)}
              placeholder={t('admin.discussions.linkedVersionPlaceholder')}
              disabled={busy}
            />
          </label>
          {error ? <p className="text-body-sm text-amber-300">{error}</p> : null}
        </div>

        <div className={MODAL_FOOTER}>
          <div className="flex justify-end gap-2 py-1">
            <button type="button" className={SETTINGS_BTN_SECONDARY} onClick={onClose} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={cn(
                SETTINGS_BTN_SECONDARY,
                'border-primary/40 text-primary hover:bg-primary/10',
                !canSubmit && 'opacity-50',
              )}
              onClick={() => void submit()}
              disabled={!canSubmit}
            >
              {busy ? t('common.loading') : t('admin.discussions.markSynced')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
