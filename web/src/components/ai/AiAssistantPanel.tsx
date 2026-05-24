import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { useAiAssistant } from '@/components/ai/AiAssistantContext'
import { cn } from '@/lib/cn'
import {
  AI_PANEL_WIDTH_MAX,
  AI_PANEL_WIDTH_MIN,
  readAiAssistantPanelWidth,
  writeAiAssistantPanelWidth,
} from '@/lib/aiAssistantPanelWidth'
import { MODAL_CLOSE_BTN, MOTIVATOR_INPUT } from '@/lib/designClasses'
import { useDialogFocusTrap } from '@/lib/useDialogFocusTrap'

const EXAMPLE_KEYS = ['aiAssistant.example1', 'aiAssistant.example2', 'aiAssistant.example3'] as const

type PanelBodyProps = {
  mode: 'overlay' | 'docked'
  width: number
  panelRef: RefObject<HTMLElement | null>
  closeRef: RefObject<HTMLButtonElement | null>
  onResizeWidth: (width: number) => void
}

function AiPanelResizeHandle({ onResizeWidth }: { onResizeWidth: (width: number) => void }) {
  const { t } = useTranslation()

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = readAiAssistantPanelWidth()

      function onPointerMove(ev: PointerEvent) {
        const next = Math.min(
          AI_PANEL_WIDTH_MAX,
          Math.max(AI_PANEL_WIDTH_MIN, startWidth + (startX - ev.clientX)),
        )
        onResizeWidth(next)
      }

      function onPointerUp(ev: PointerEvent) {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
        const finalWidth = Math.min(
          AI_PANEL_WIDTH_MAX,
          Math.max(AI_PANEL_WIDTH_MIN, startWidth + (startX - ev.clientX)),
        )
        writeAiAssistantPanelWidth(finalWidth)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
    },
    [onResizeWidth],
  )

  return (
    <button
      type="button"
      role="separator"
      aria-orientation="vertical"
      aria-label={t('aiAssistant.resizeHandle')}
      className="absolute inset-y-0 left-0 z-10 w-2 -translate-x-1/2 cursor-col-resize touch-none border-0 bg-transparent p-0 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-surface-variant/80 hover:before:bg-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      onPointerDown={onPointerDown}
    />
  )
}

function AiAssistantPanelBody({
  mode,
  width,
  panelRef,
  closeRef,
  onResizeWidth,
}: PanelBodyProps) {
  const { t } = useTranslation()
  const { closeAssistant } = useAiAssistant()

  return (
    <aside
      ref={panelRef}
      id="ai-assistant-panel"
      role={mode === 'overlay' ? 'dialog' : 'complementary'}
      aria-modal={mode === 'overlay' ? true : undefined}
      aria-labelledby="ai-assistant-title"
      style={mode === 'docked' ? { width: `${width}px` } : undefined}
      className={cn(
        'relative flex min-h-dvh shrink-0 flex-col',
        'border-surface-variant bg-surface-container-lowest shadow-2xl',
        mode === 'overlay'
          ? cn(
              'w-full max-w-[min(100vw,24rem)] border-l ai-assistant-drawer',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            )
          : 'border-l',
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {mode === 'docked' ? <AiPanelResizeHandle onResizeWidth={onResizeWidth} /> : null}

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
  )
}

type Props = {
  mode: 'overlay' | 'docked'
}

export function AiAssistantPanel({ mode }: Props) {
  const { t } = useTranslation()
  const { open, closeAssistant } = useAiAssistant()
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(readAiAssistantPanelWidth)
  useDialogFocusTrap(open, panelRef, closeRef)

  const onResizeWidth = useCallback((next: number) => {
    setWidth(next)
  }, [])

  useEffect(() => {
    if (!open || mode !== 'overlay') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mode])

  if (!open) return null

  const body = (
    <AiAssistantPanelBody
      mode={mode}
      width={width}
      panelRef={panelRef}
      closeRef={closeRef}
      onResizeWidth={onResizeWidth}
    />
  )

  if (mode === 'docked') {
    return body
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 glass-overlay"
        aria-label={t('common.close')}
        onClick={closeAssistant}
      />
      {body}
    </div>,
    document.body,
  )
}
