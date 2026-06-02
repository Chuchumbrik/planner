import { useRef, useState } from 'react'
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
  /** Phase 7.12 — swipe-влево/кнопка «Решить» по open-треду (touch); открывает быстрое действие. */
  onResolveSwipe?: (id: string) => void
}

/** Body preview = first non-empty line of the discussion body, trimmed. */
export function previewLine(body: string | undefined): string {
  if (!body) return ''
  const line = body.split('\n').map((l) => l.trim()).find((l) => l.length > 0)
  return line ? line.replace(/^[#>*\-\s]+/, '').slice(0, 140) : ''
}

const SWIPE_THRESHOLD_PX = 60

/**
 * Phase 7.12 — обёртка строки треда со swipe-влево (Pointer Events, без зависимостей).
 * Свайп только для touch/stylus; на мыши — доступна обычная кнопка-альтернатива «Решить».
 * При `disabled` (не-open тред или нет обработчика) — overlay/кнопка не показываются.
 */
function SwipeableItem({
  children,
  onResolve,
  resolveAria,
  resolveLabel,
  closeAria,
  disabled,
}: {
  children: React.ReactNode
  onResolve: () => void
  resolveAria: string
  resolveLabel: string
  closeAria: string
  disabled: boolean
}) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'mouse') return
    startX.current = e.clientX
    startY.current = e.clientY
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    const dy = startY.current === null ? 0 : e.clientY - startY.current
    startX.current = null
    startY.current = null
    // Только преимущественно горизонтальный жест влево открывает overlay —
    // вертикальный скролл (|dy| > |dx|) не должен срабатывать как swipe-to-resolve.
    if (dx < -SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) setRevealed(true)
  }
  const onPointerCancel = () => {
    startX.current = null
    startY.current = null
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {children}
      {!disabled ? (
        <>
          {/* Fallback-кнопка (видна без свайпа — для мыши/клавиатуры). */}
          {!revealed ? (
            <button
              type="button"
              onClick={onResolve}
              aria-label={resolveAria}
              className="absolute inset-y-0 right-2 my-auto hidden h-7 items-center rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 md:inline-flex"
            >
              <MaterialIcon name="check" size={14} className="mr-1" />
              {resolveLabel}
            </button>
          ) : null}
          {/* Swipe-reveal overlay (touch). */}
          {revealed ? (
            <div className="animate-swipe-reveal absolute inset-y-0 right-0 flex items-center gap-1 rounded-r-lg bg-emerald-600/90 px-3">
              <button
                type="button"
                onClick={() => {
                  setRevealed(false)
                  onResolve()
                }}
                aria-label={resolveAria}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-white hover:bg-white/10"
              >
                <MaterialIcon name="check" size={16} />
                {resolveLabel}
              </button>
              <button
                type="button"
                onClick={() => setRevealed(false)}
                aria-label={closeAria}
                className="inline-flex items-center rounded-md p-1 text-white/90 hover:bg-white/10"
              >
                <MaterialIcon name="close" size={16} />
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function DiscussionList({
  discussions,
  loadBusy,
  loadError,
  onSelect,
  onCreateClick,
  onRetry,
  onResolveSwipe,
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
            const canResolve = d.status === 'open' && Boolean(onResolveSwipe)
            return (
              <li key={d.id}>
                <SwipeableItem
                  disabled={!canResolve}
                  onResolve={() => onResolveSwipe?.(d.id)}
                  resolveLabel={t('admin.discussions.resolve')}
                  resolveAria={t('admin.discussions.resolveSwipeAria', { title: d.title })}
                  closeAria={t('common.close')}
                >
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
                </SwipeableItem>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
