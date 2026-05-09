import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IDEAS_LATER_ITEMS,
  IMPLEMENTED_BLOCKS,
  MVP_PLANNED_ITEMS,
  type LocalizedString,
} from '@/data/productRoadmap'

function pickLocale(s: LocalizedString, lang: string): string {
  return lang === 'en' ? s.en : s.ru
}

export type ProductRoadmapModalProps = {
  open: boolean
  onClose: () => void
}

function Chevron() {
  return (
    <span
      className="text-[10px] text-zinc-500 transition-transform duration-200 group-open:rotate-180"
      aria-hidden
    >
      ▾
    </span>
  )
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
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="roadmap-modal-title"
        className="scrollbar-site max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-600 bg-zinc-950 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="roadmap-modal-title" className="text-base font-semibold text-zinc-100">
              {t('settings.roadmapTitle')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapIntro')}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded px-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <details open className="group rounded-lg border border-zinc-800 bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-emerald-400/95 hover:bg-zinc-900/80">
              <span>{t('settings.roadmapImplemented')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-zinc-800 px-3 pb-4 pt-1">
              <div className="flex flex-col gap-5 pt-3">
                {IMPLEMENTED_BLOCKS.map((block, bi) => (
                  <div key={bi}>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
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
            </div>
          </details>

          <details className="group rounded-lg border border-zinc-800 bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-amber-400/95 hover:bg-zinc-900/80">
              <span>{t('settings.roadmapMvp')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-zinc-800 px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapMvpHint')}</p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
                {MVP_PLANNED_ITEMS.map((item, i) => (
                  <li key={i}>{pickLocale(item, lang)}</li>
                ))}
              </ul>
            </div>
          </details>

          <details className="group rounded-lg border border-zinc-800 bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-violet-400/95 hover:bg-zinc-900/80">
              <span>{t('settings.roadmapIdeas')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-zinc-800 px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapIdeasHint')}</p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
                {IDEAS_LATER_ITEMS.map((item, i) => (
                  <li key={i}>{pickLocale(item, lang)}</li>
                ))}
              </ul>
            </div>
          </details>
        </div>

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
