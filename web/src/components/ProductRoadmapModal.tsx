import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BACKLOG_ITEMS,
  IMPLEMENTED_BLOCKS,
  type LocalizedString,
} from '@/data/productRoadmap'

function pickLocale(s: LocalizedString, lang: string): string {
  return lang === 'en' ? s.en : s.ru
}

export type ProductRoadmapModalProps = {
  open: boolean
  onClose: () => void
}

export function ProductRoadmapModal({ open, onClose }: ProductRoadmapModalProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'ru'

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
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="roadmap-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="scrollbar-site max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-600 bg-zinc-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="roadmap-modal-title" className="text-base font-semibold text-zinc-100">
              {t('settings.roadmapTitle')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapIntro')}</p>
          </div>
          <button
            type="button"
            className="shrink-0 text-zinc-500 hover:text-zinc-300"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">
            {t('settings.roadmapImplemented')}
          </h3>
          <div className="mt-3 flex flex-col gap-5">
            {IMPLEMENTED_BLOCKS.map((block, bi) => (
              <div key={bi}>
                <p className="text-sm font-medium text-zinc-300">
                  {pickLocale(block.dateLabel, lang)}
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
                  {block.items.map((item, ii) => (
                    <li key={ii}>{pickLocale(item, lang)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-zinc-800 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-500/90">
            {t('settings.roadmapBacklog')}
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
            {BACKLOG_ITEMS.map((item, i) => (
              <li key={i}>{pickLocale(item, lang)}</li>
            ))}
          </ul>
        </section>

        <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
