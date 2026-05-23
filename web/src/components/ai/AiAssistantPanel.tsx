import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { useAiAssistant } from '@/components/ai/AiAssistantContext'
import { cn } from '@/lib/cn'
import { MODAL_CLOSE_BTN, MOTIVATOR_INPUT } from '@/lib/designClasses'

const EXAMPLE_KEYS = ['aiAssistant.example1', 'aiAssistant.example2', 'aiAssistant.example3'] as const

export function AiAssistantPanel() {
  const { t } = useTranslation()
  const { open, closeAssistant } = useAiAssistant()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 glass-overlay"
        aria-label={t('common.close')}
        onClick={closeAssistant}
      />
      <aside
        id="ai-assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-title"
        className={cn(
          'relative flex h-full w-full max-w-[min(100vw,24rem)] flex-col',
          'border-l border-surface-variant bg-surface-container-lowest shadow-2xl',
          'ai-assistant-drawer',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-surface-variant px-sm py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              aria-hidden
            >
              <MaterialIcon name="psychology" size={22} filled />
            </div>
            <div className="min-w-0">
              <h2 id="ai-assistant-title" className="truncate text-label-md font-semibold text-on-surface">
                {t('aiAssistant.title')}
              </h2>
              <p className="text-label-sm text-on-surface-variant">{t('aiAssistant.subtitle')}</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={cn('rounded-lg p-2', MODAL_CLOSE_BTN)}
            onClick={closeAssistant}
            aria-label={t('common.close')}
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-sm py-sm">
          <p className="rounded-card border border-primary/25 bg-primary/5 px-3 py-2 text-body-sm text-on-surface-variant">
            {t('aiAssistant.prototypeNote')}
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-card rounded-tl-sm border border-surface-variant bg-surface-container-low px-3 py-2">
                <p className="text-body-sm text-on-surface">{t('aiAssistant.welcome')}</p>
              </div>
            </div>
            {EXAMPLE_KEYS.map((key) => (
              <div key={key} className="flex justify-end">
                <div className="max-w-[90%] rounded-card rounded-tr-sm border border-primary/30 bg-primary/10 px-3 py-2">
                  <p className="text-body-sm text-on-surface">{t(key)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-surface-variant px-sm py-3">
          <label className="sr-only" htmlFor="ai-assistant-input">
            {t('aiAssistant.inputLabel')}
          </label>
          <div className="flex items-end gap-2">
            <input
              id="ai-assistant-input"
              type="text"
              disabled
              readOnly
              aria-disabled="true"
              placeholder={t('aiAssistant.inputPlaceholder')}
              className={cn(MOTIVATOR_INPUT, 'min-w-0 flex-1 cursor-not-allowed opacity-70')}
            />
            <button
              type="button"
              disabled
              className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center p-0 opacity-50"
              aria-label={t('aiAssistant.sendDisabled')}
            >
              <MaterialIcon name="send" size={20} className="text-on-primary" />
            </button>
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">{t('aiAssistant.inputHint')}</p>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
