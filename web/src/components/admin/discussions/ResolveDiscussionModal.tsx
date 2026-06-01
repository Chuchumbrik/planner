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
  onResolved: (d: Discussion) => void
  onClose: () => void
}

/** Resolve modal: open → pending-journal, captures a resolution summary. */
export function ResolveDiscussionModal({ discussionId, supabase, onResolved, onClose }: Props) {
  const { t } = useTranslation()
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = summary.trim() !== '' && !busy

  async function submit() {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    const result = await invokeDiscussionsFn(supabase, {
      action: 'resolve',
      discussionId,
      resolutionSummary: summary.trim(),
    })
    setBusy(false)
    if (!result) return
    if ('error' in result) {
      setError(isStaleStatusError(result.error) ? t('admin.discussions.staleStatus') : result.error)
      return
    }
    const updated = result.raw.discussion as Discussion | undefined
    if (updated) onResolved(updated)
  }

  return (
    <div className={MODAL_OVERLAY} onClick={busy ? undefined : onClose}>
      <div className={MODAL_SHELL} onClick={(e) => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className={MODAL_TITLE}>{t('admin.discussions.resolveTitle')}</h2>
          <button type="button" className={MODAL_CLOSE_BTN} onClick={onClose} disabled={busy}>
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-sm md:p-md">
          <label className="block">
            <span className="mb-1 block text-label-sm text-on-surface-variant">
              {t('admin.discussions.resolutionSummary')}
            </span>
            <textarea
              className={cn(MOTIVATOR_INPUT, 'min-h-[8rem] resize-y')}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={t('admin.discussions.resolutionSummaryPlaceholder')}
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
                'border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10',
                !canSubmit && 'opacity-50',
              )}
              onClick={() => void submit()}
              disabled={!canSubmit}
            >
              {busy ? t('common.loading') : t('admin.discussions.resolve')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
