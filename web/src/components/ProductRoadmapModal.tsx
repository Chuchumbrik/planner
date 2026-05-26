import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ProductRoadmapPanel } from '@/components/ProductRoadmapPanel'
import { MODAL_OVERLAY, MODAL_TITLE } from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import { useDialogFocusTrap } from '@/lib/useDialogFocusTrap'

export type ProductRoadmapModalProps = {
  open: boolean
  onClose: () => void
}

/** Модалка «Краткая сводка» — только из настроек (для пользователей без админ-панели). */
export function ProductRoadmapModal({ open, onClose }: ProductRoadmapModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocusTrap(open, dialogRef)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={cn(MODAL_OVERLAY, 'z-[70]')}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal
        aria-labelledby="roadmap-modal-title"
        className="scrollbar-site max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-card border border-surface-variant bg-surface-container-lowest p-sm shadow-2xl md:p-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="roadmap-modal-title" className={MODAL_TITLE}>
              {t('settings.roadmapTitle')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{t('settings.roadmapIntroModal')}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded px-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <ProductRoadmapPanel className="mt-6" />

        <div className="mt-6 flex justify-end border-t border-surface-variant pt-4">
          <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
