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
import { invokeDiscussionsFn, type Discussion } from '@/lib/discussionsApi'

interface Props {
  supabase: SupabaseClient
  onCreated: (d: Discussion) => void
  onClose: () => void
}

/** New-discussion modal: title + body (markdown) + optional linked version. */
export function CreateDiscussionModal({ supabase, onCreated, onClose }: Props) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [linkedVersion, setLinkedVersion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = title.trim() !== '' && body.trim() !== '' && !busy

  async function submit() {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    const result = await invokeDiscussionsFn(supabase, {
      action: 'create',
      title: title.trim(),
      body: body.trim(),
      ...(linkedVersion.trim() ? { linkedVersion: linkedVersion.trim() } : {}),
    })
    setBusy(false)
    if (!result) return
    if ('error' in result) {
      setError(result.error)
      return
    }
    const created = result.raw.discussion as Discussion | undefined
    if (created) onCreated(created)
  }

  return (
    <div className={MODAL_OVERLAY} onClick={busy ? undefined : onClose}>
      <div className={MODAL_SHELL} onClick={(e) => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className={MODAL_TITLE}>{t('admin.discussions.createTitle')}</h2>
          <button type="button" className={MODAL_CLOSE_BTN} onClick={onClose} disabled={busy}>
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-sm md:p-md">
          <label className="block">
            <span className="mb-1 block text-label-sm text-on-surface-variant">
              {t('admin.discussions.titleField')}
            </span>
            <input
              type="text"
              className={MOTIVATOR_INPUT}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin.discussions.titlePlaceholder')}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-sm text-on-surface-variant">
              {t('admin.discussions.bodyField')}
            </span>
            <textarea
              className={cn(MOTIVATOR_INPUT, 'min-h-[8rem] resize-y')}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('admin.discussions.bodyPlaceholder')}
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
              {busy ? t('common.loading') : t('admin.discussions.createSubmit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
