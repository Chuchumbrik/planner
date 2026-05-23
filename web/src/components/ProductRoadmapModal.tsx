import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  groupIdeasLaterForDisplay,
  IDEAS_LATER_ENTRIES,
  IMPLEMENTED_MVP_PHASES,
  MVP_PHASES_PLANNED,
  RELEASE_NOTES_BLOCKS,
  type LocalizedString,
  type RoadmapIdeaEntry,
  type RoadmapMvpPhase,
  type RoadmapReleaseNoteBlock,
  type RoadmapReleaseNoteItem,
} from '@/data/productRoadmap'
import {
  MODAL_OVERLAY,
  MODAL_TITLE,
  ROADMAP_ACCENT_NEUTRAL,
  ROADMAP_ACCENT_SHIPPED,
  ROADMAP_DETAILS_SUMMARY,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

function pickLocale(s: LocalizedString, lang: string): string {
  return lang === 'en' ? s.en : s.ru
}

/** Семвер `x.y.z` из строки версии (без build metadata). */
function semverTuple(v: string): [number, number, number] {
  const m = v.trim().match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!m) return [0, 0, 0]
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/** Новее (больше semver) — выше в списке. */
function compareSemverDesc(a: string, b: string): number {
  const [a1, a2, a3] = semverTuple(a)
  const [b1, b2, b3] = semverTuple(b)
  if (a1 !== b1) return b1 - a1
  if (a2 !== b2) return b2 - a2
  return b3 - a3
}

/** Подблоки одного дня: порядок по убыванию `releasedInVersion`, при равенстве — как в файле. */
function sortReleaseNoteItems(items: RoadmapReleaseNoteItem[], lang: string): RoadmapReleaseNoteItem[] {
  return [...items]
    .map((item, origIdx) => ({ item, origIdx }))
    .sort((x, y) => {
      const c = compareSemverDesc(
        pickLocale(x.item.releasedInVersion, lang),
        pickLocale(y.item.releasedInVersion, lang),
      )
      return c !== 0 ? c : x.origIdx - y.origIdx
    })
    .map(({ item }) => item)
}

/** Ключ даты `YYYY-MM-DD` для группировки (локальный календарь в строке). */
function blockDateKey(block: RoadmapReleaseNoteBlock): string {
  return block.dateLabel.ru.trim()
}

/**
 * Релиз-ноты: группировка по календарной дате, без скрытия по «сегодня».
 * Несколько объектов с одной `dateLabel` в данных дают несколько сегментов под одной раскрывашкой (несколько деплоев за день).
 */
function groupReleaseNotesForUi(
  blocks: RoadmapReleaseNoteBlock[],
): { dateKey: string; dateLabel: LocalizedString; segments: RoadmapReleaseNoteBlock[] }[] {
  const byDay = new Map<string, RoadmapReleaseNoteBlock[]>()
  for (const block of blocks) {
    const key = blockDateKey(block)
    const list = byDay.get(key) ?? []
    list.push(block)
    byDay.set(key, list)
  }
  const keys = [...byDay.keys()].sort((a, b) => b.localeCompare(a))
  return keys.map((k) => ({
    dateKey: k,
    dateLabel: byDay.get(k)![0].dateLabel,
    segments: byDay.get(k)!,
  }))
}

export type ProductRoadmapModalProps = {
  open: boolean
  onClose: () => void
}

/** Доля закрытых фаз 0–6 от всех фаз дорожной карты до 1.0.0 (0–6 + 7–13). */
function MvpProgressRing({ shipped, total }: { shipped: number; total: number }) {
  const frac = total === 0 ? 0 : shipped / total
  const size = 120
  const stroke = 10
  const cx = size / 2
  const cy = size / 2
  const r = cx - stroke / 2 - 2
  const circ = 2 * Math.PI * r
  const dashDone = frac * circ
  const dashRest = circ - dashDone

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgb(39 39 42)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgb(5 150 105)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dashDone} ${dashRest}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  )
}

function Chevron({ nested }: { nested?: boolean }) {
  return (
    <span
      className={`${nested ? 'text-[9px] group-open/details:rotate-180' : 'text-[10px] group-open:rotate-180'} text-on-surface-variant transition-transform duration-200`}
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
  const badgeClass = variant === 'shipped' ? ROADMAP_ACCENT_SHIPPED : ROADMAP_ACCENT_NEUTRAL
  const detailsAccent = variant === 'shipped' ? 'text-primary/85' : ROADMAP_ACCENT_NEUTRAL
  return (
    <li className="rounded-lg border border-surface-variant/90 bg-surface-container-lowest/50">
      <div className="px-3 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}>
            {t('settings.roadmapPhaseBadge', { n: phase.id })}
          </span>
          <span className="text-sm font-semibold text-on-surface">{pickLocale(phase.title, lang)}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">{pickLocale(phase.summary, lang)}</p>
        {phase.plain ? (
          <p className="mt-2 border-l-2 border-surface-variant/80 pl-3 text-xs leading-relaxed text-on-surface-variant">
            <span className="font-medium text-on-surface-variant">{t('settings.roadmapReleaseNotePlain')} </span>
            {pickLocale(phase.plain, lang)}
          </p>
        ) : null}
        {hasDetails ? (
          <details className="group/details mt-2 rounded-md border border-surface-variant/80 bg-surface-container-low/35 [&_summary::-webkit-details-marker]:hidden">
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium hover:bg-surface-container-low/55 ${detailsAccent}`}
            >
              <span>{t('settings.roadmapExpandDetails')}</span>
              <Chevron nested />
            </summary>
            <ul className="list-disc space-y-1.5 border-t border-surface-variant/80 px-5 py-2 pb-3 text-[11px] leading-relaxed text-on-surface-variant">
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
    <li className="rounded-lg border border-surface-variant/90 bg-surface-container-lowest/50">
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-on-surface">{pickLocale(idea.title, lang)}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">{pickLocale(idea.summary, lang)}</p>
        {hasDetails ? (
          <details className="group/details mt-2 rounded-md border border-surface-variant/80 bg-surface-container-low/35 [&_summary::-webkit-details-marker]:hidden">
            <summary className={ROADMAP_DETAILS_SUMMARY}>
              <span>{t('settings.roadmapExpandDetails')}</span>
              <Chevron nested />
            </summary>
            <ul className="list-disc space-y-1.5 border-t border-surface-variant/80 px-5 py-2 pb-3 text-[11px] leading-relaxed text-on-surface-variant">
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

  const { mvpPct, phasesShipped, phasesTotal } = useMemo(() => {
    const shipped = IMPLEMENTED_MVP_PHASES.length
    const total = shipped + MVP_PHASES_PLANNED.length
    const pct = total === 0 ? 0 : Math.round((shipped / total) * 100)
    return { mvpPct: pct, phasesShipped: shipped, phasesTotal: total }
  }, [])

  const releaseNotesByDay = useMemo(() => groupReleaseNotesForUi(RELEASE_NOTES_BLOCKS), [])
  const ideasLaterGroups = useMemo(() => groupIdeasLaterForDisplay(IDEAS_LATER_ENTRIES), [])
  const ideasLaterTotal = IDEAS_LATER_ENTRIES.length

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
            <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{t('settings.roadmapIntro')}</p>
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

        <div
          className="mt-6 rounded-lg border border-surface-variant/80 bg-surface-container-low/40 px-4 py-4"
          role="img"
          aria-label={t('settings.roadmapMvpProgressCaption', {
            pct: mvpPct,
            done: phasesShipped,
            total: phasesTotal,
          })}
        >
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
            {t('settings.roadmapMvpProgressTitle')}
          </p>
          <div className="mt-3 flex flex-col items-center gap-2">
            <MvpProgressRing shipped={phasesShipped} total={phasesTotal} />
            <p className="max-w-sm text-center text-sm leading-snug text-on-surface-variant">
              {t('settings.roadmapMvpProgressCaption', {
                pct: mvpPct,
                done: phasesShipped,
                total: phasesTotal,
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <details className="group rounded-lg border border-surface-variant bg-surface-container-low/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-primary/95 hover:bg-surface-container-low/80">
              <span>{t('settings.roadmapImplemented')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-surface-variant px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">{t('settings.roadmapImplementedHint')}</p>
              <ol className="flex flex-col gap-2">
                {IMPLEMENTED_MVP_PHASES.map((phase) => (
                  <PhaseRow key={phase.id} phase={phase} lang={lang} variant="shipped" />
                ))}
              </ol>
            </div>
          </details>

          <details className="group rounded-lg border border-surface-variant bg-surface-container-low/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low/80">
              <span>{t('settings.roadmapMvp')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-surface-variant px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">{t('settings.roadmapMvpHint')}</p>
              <ol className="flex flex-col gap-2">
                {MVP_PHASES_PLANNED.map((phase) => (
                  <PhaseRow key={phase.id} phase={phase} lang={lang} variant="planned" />
                ))}
              </ol>
            </div>
          </details>

          <details className="group rounded-lg border border-surface-variant bg-surface-container-low/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-primary/95 hover:bg-surface-container-low/80">
              <span>{t('settings.roadmapReleaseNotes')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-surface-variant px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">{t('settings.roadmapReleaseNotesHint')}</p>
              <div className="flex flex-col gap-2">
                {releaseNotesByDay.map((day) => (
                  <details
                    key={day.dateKey}
                    className="group/details rounded-lg border border-surface-variant/90 bg-surface-container-lowest/40 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary/90 hover:bg-surface-container-low/55">
                      <span>{pickLocale(day.dateLabel, lang)}</span>
                      <Chevron nested />
                    </summary>
                    <div className="border-t border-surface-variant/80 px-3 pb-3 pt-2">
                      <div className="flex flex-col gap-3">
                        {day.segments.map((segment, si) => (
                          <div
                            key={si}
                            className={
                              day.segments.length > 1
                                ? 'rounded-lg border border-surface-variant/70 bg-surface-container-lowest/35 p-2'
                                : ''
                            }
                          >
                            <div className="flex flex-col gap-4">
                              {sortReleaseNoteItems(segment.items, lang).map((item, ii) => (
                                <div
                                  key={ii}
                                  className="rounded-lg border border-surface-variant/90 bg-surface-container-lowest/45 px-3 py-2.5"
                                >
                                  <p className="mb-2 text-[11px] font-medium tabular-nums text-on-surface-variant">
                                    {t('settings.roadmapReleaseNoteShippedIn', {
                                      version: pickLocale(item.releasedInVersion, lang),
                                    })}
                                  </p>
                                  <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-on-surface">
                                    {item.changes.map((c, ci) => (
                                      <li key={ci} className="marker:text-on-surface-variant">
                                        {pickLocale(c, lang)}
                                      </li>
                                    ))}
                                  </ul>
                                  {item.plainBullets?.length ? (
                                    <details className="group/details mt-3 rounded-md border border-surface-variant/80 bg-surface-container-low/35 [&_summary::-webkit-details-marker]:hidden">
                                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-2 text-xs font-medium text-primary/85 hover:bg-surface-container-low/55">
                                        <span>{t('settings.roadmapReleaseNotePlainDetails')}</span>
                                        <Chevron nested />
                                      </summary>
                                      <div className="border-t border-surface-variant/80 px-3 pb-3 pt-2">
                                        <p className="text-[11px] leading-relaxed text-on-surface-variant">
                                          {t('settings.roadmapReleaseNotePlainLead')}
                                        </p>
                                        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-on-surface-variant">
                                          {item.plainBullets.map((p, pi) => (
                                            <li key={pi} className="marker:text-on-surface-variant">
                                              {pickLocale(p, lang)}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </details>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </details>

          <details className="group rounded-lg border border-surface-variant bg-surface-container-low/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low/80">
              <span>
                {t('settings.roadmapIdeas')}{' '}
                <span className="font-normal tabular-nums text-on-surface-variant/70">
                  ({t('settings.roadmapIdeasCount', { count: ideasLaterTotal })})
                </span>
              </span>
              <Chevron />
            </summary>
            <div className="border-t border-surface-variant px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">{t('settings.roadmapIdeasHint')}</p>
              <div className="flex flex-col gap-2">
                {ideasLaterGroups.map((g) => (
                  <details
                    key={g.groupId}
                    className="group/details rounded-lg border border-surface-variant/90 bg-surface-container-lowest/40 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low/55">
                      <span className="min-w-0 text-left">
                        {t(`settings.roadmapIdeaGroup_${g.groupId}` as const)}{' '}
                        <span className="font-normal tabular-nums text-on-surface-variant">
                          ({t('settings.roadmapIdeasCount', { count: g.ideas.length })})
                        </span>
                      </span>
                      <Chevron nested />
                    </summary>
                    <ul className="flex flex-col gap-2 border-t border-surface-variant/80 px-3 py-3">
                      {g.ideas.map((idea) => (
                        <IdeaRow
                          key={`${g.groupId}-${idea.ideaLaterOrder ?? 0}-${pickLocale(idea.title, lang)}`}
                          idea={idea}
                          lang={lang}
                        />
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          </details>

          <details className="group rounded-lg border border-surface-variant bg-surface-container-low/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-orange-400/95 hover:bg-surface-container-low/80">
              <span>{t('settings.roadmapOpenQuestions')}</span>
              <Chevron />
            </summary>
            <div className="border-t border-surface-variant px-3 pb-4 pt-3">
              <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">{t('settings.roadmapOpenQuestionsHint')}</p>
              <p className="text-sm leading-relaxed text-on-surface-variant">{t('settings.roadmapOpenQuestionBacklogUx')}</p>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t('settings.roadmapOpenQuestionCpt')}</p>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t('settings.roadmapOpenQuestionEodAuto')}</p>
            </div>
          </details>
        </div>

        <div className="mt-6 flex justify-end border-t border-surface-variant pt-4">
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
