import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { relativeDayLabel } from '@/lib/relativeTime'
import type { Discussion } from '@/lib/discussionsApi'
import { SETTINGS_BTN_SECONDARY } from '@/lib/designClasses'
import { DiscussionStatusChip } from './DiscussionStatusChip'

interface Props {
  discussions: Discussion[]
  loadBusy: boolean
  loadError: string | null
  onSelect: (id: string) => void
  onCreateClick: () => void
  onRetry: () => void
}

/** Body preview = first non-empty line of the discussion body, trimmed. */
export function previewLine(body: string | undefined): string {
  if (!body) return ''
  const line = body.split('\n').map((l) => l.trim()).find((l) => l.length > 0)
  return line ? line.replace(/^[#>*\-\s]+/, '').slice(0, 140) : ''
}

export function DiscussionList({
  discussions,
  loadBusy,
  loadError,
  onSelect,
  onCreateClick,
  onRetry,
}: Props) {
  const { t, i18n } = useTranslation()
  const lang: 'ru' | 'en' = i18n.language === 'en' ? 'en' : 'ru'
  const now = new Date()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-body-sm text-on-surface-variant">
          {t('admin.discussions.count', { count: discussions.length })}
        </span>
        <button
          type="button"
          className={cn(SETTINGS_BTN_SECONDARY, 'flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10')}
          onClick={onCreateClick}
        >
          <MaterialIcon name="add" size={16} />
          {t('admin.discussions.newDiscussion')}
        </button>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-body-sm text-amber-300">
          <p>{loadError}</p>
          <button
            type="button"
            className={cn(SETTINGS_BTN_SECONDARY, 'mt-2')}
            onClick={onRetry}
          >
            {t('common.retry')}
          </button>
        </div>
      ) : loadBusy && discussions.length === 0 ? (
        <p className="py-8 text-center text-body-sm text-on-surface-variant">{t('common.loading')}</p>
      ) : discussions.length === 0 ? (
        <p className="py-8 text-center text-body-sm text-on-surface-variant">{t('admin.discussions.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {discussions.map((d) => {
            const preview = previewLine(d.body)
            const activity = d.last_reply_at ?? d.created_at
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onSelect(d.id)}
                  className="flex w-full flex-col gap-1.5 rounded-lg border border-surface-variant bg-surface-container-low/50 p-sm text-left transition-colors hover:bg-surface-container md:p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {d.unread ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-label={t('admin.discussions.unread')}
                        />
                      ) : null}
                      <span className="truncate font-medium text-on-surface">{d.title}</span>
                    </span>
                    <DiscussionStatusChip status={d.status} className="shrink-0" />
                  </div>
                  {preview ? (
                    <span className="line-clamp-1 text-body-sm text-on-surface-variant">{preview}</span>
                  ) : null}
                  <span className="flex items-center gap-3 text-xs text-on-surface-variant/60">
                    <span className="inline-flex items-center gap-1">
                      <MaterialIcon name="forum" size={13} />
                      {t('admin.discussions.replies', { count: d.reply_count })}
                    </span>
                    <span>{relativeDayLabel(activity, now, lang)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
