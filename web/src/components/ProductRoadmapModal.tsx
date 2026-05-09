import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IDEAS_LATER_ENTRIES,
  IMPLEMENTED_MVP_PHASES,
  MVP_PHASES_PLANNED,
  RELEASE_NOTES_BLOCKS,
  type LocalizedString,
  type RoadmapIdeaEntry,
  type RoadmapMvpPhase,
} from '@/data/productRoadmap'

function pickLocale(s: LocalizedString, lang: string): string {
  return lang === 'en' ? s.en : s.ru
}

export type ProductRoadmapModalProps = {
  open: boolean
  onClose: () => void
}

function Chevron({ nested }: { nested?: boolean }) {
  return (
    <span
      className={`${nested ? 'text-[9px] group-open/details:rotate-180' : 'text-[10px] group-open:rotate-180'} text-zinc-500 transition-transform duration-200`}
      aria-hidden
    >
      ▾
    </span>
  )
}

function PhaseRow({
  phase,
  lang,
  variant,
}: {
  phase: RoadmapMvpPhase
  lang: string
  /** shipped — те же карточки, что в «плане», но бейдж в тоне блока «реализовано» */
  variant: 'shipped' | 'planned'
}) {
  const { t } = useTranslation()
  const hasDetails = phase.detailBullets.length > 0
  const badgeClass =
    variant === 'shipped'
      ? 'text-emerald-500/90'
      : 'text-amber-500/85'
  const detailsAccent =
    variant === 'shipped'
      ? 'text-emerald-400/85'
      : 'text-amber-400/85'
  return (
    <li className="rounded-lg border border-zinc-800/90 bg-zinc-950/50">
      <div className="px-3 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}>
            {t('settings.roadmapPhaseBadge', { n: phase.id })}
          </span>
          <span className="text-sm font-semibold text-zinc-100">{pickLocale(phase.title, lang)}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{pickLocale(phase.summary, lang)}</p>
        {hasDetails ? (
          <details className="group/details mt-2 rounded-md border border-zinc-800/80 bg-zinc-900/35 [&_summary::-webkit-details-marker]:hidden">
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium hover:bg-zinc-900/55 ${detailsAccent}`}
            >
              <span>{t('settings.roadmapExpandDetails')}</span>
              <Chevron nested />
            </summary>
            <ul className="list-disc space-y-1.5 border-t border-zinc-800/80 px-5 py-2 pb-3 text-[11px] leading-relaxed text-zinc-400">
              {phase.detailBullets.map((b, i) => (
                <li key={i}>{pickLocale(b, lang)}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </li>
  )
}

function IdeaRow({ idea, lang }: { idea: RoadmapIdeaEntry; lang: string }) {
  const { t } = useTranslation()
  const bullets = idea.detailBullets ?? []
  const hasDetails = bullets.length > 0
  return (
    <li className="rounded-lg border border-zinc-800/90 bg-zinc-950/50">
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-zinc-100">{pickLocale(idea.title, lang)}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{pickLocale(idea.summary, lang)}</p>
        {hasDetails ? (
          <details className="group/details mt-2 rounded-md border border-zinc-800/80 bg-zinc-900/35 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium text-violet-400/85 hover:bg-zinc-900/55">
              <span>{t('settings.roadmapExpandDetails')}</span>
              <Chevron nested />
            </summary>
            <ul className="list-disc space-y-1.5 border-t border-zinc-800/80 px-5 py-2 pb-3 text-[11px] leading-relaxed text-zinc-400">
              {bullets.map((b, i) => (
                <li key={i}>{pickLocale(b, lang)}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </li>
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
        className="scrollbar-site max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-600 bg-zinc-950 p-4 shadow-2xl"
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
            <div className="border-t border-zinc-800 px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapImplementedHint')}</p>
              <ol className="flex flex-col gap-2">
                {IMPLEMENTED_MVP_PHASES.map((phase) => (
                  <PhaseRow key={phase.id} phase={phase} lang={lang} variant="shipped" />
                ))}
              </ol>
            </div>
          </details>

          <details className="group rounded-lg border border-zinc-800 bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-amber-400/95 hover:bg-zinc-900/80">
              <span>{t('settings.roadmapMvp')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-zinc-800 px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapMvpHint')}</p>
              <ol className="flex flex-col gap-2">
                {MVP_PHASES_PLANNED.map((phase) => (
                  <PhaseRow key={phase.id} phase={phase} lang={lang} variant="planned" />
                ))}
              </ol>
            </div>
          </details>

          <details className="group rounded-lg border border-zinc-800 bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-sky-400/95 hover:bg-zinc-900/80">
              <span>{t('settings.roadmapReleaseNotes')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-zinc-800 px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapReleaseNotesHint')}</p>
              <div className="flex flex-col gap-5">
                {RELEASE_NOTES_BLOCKS.map((block, bi) => (
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
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-violet-400/95 hover:bg-zinc-900/80">
              <span>{t('settings.roadmapIdeas')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-zinc-800 px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-zinc-500">{t('settings.roadmapIdeasHint')}</p>
              <ul className="flex flex-col gap-2">
                {IDEAS_LATER_ENTRIES.map((idea, i) => (
                  <IdeaRow key={i} idea={idea} lang={lang} />
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
