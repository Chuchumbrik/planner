import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  groupIdeasLaterForDisplay,
  IDEAS_LATER_ENTRIES,
  MVP_PHASES_PLANNED,
  type LocalizedString,
  type RoadmapIdeaEntry,
  type RoadmapMvpPhase,
} from '@/data/productRoadmap'
import { ideaLinkHref, ROADMAP_IDEA_STATUS_META } from './roadmapIdeaStatusMeta'

type Lang = 'ru' | 'en'

function pickLocale(s: LocalizedString, lang: Lang): string {
  return lang === 'en' ? s.en : s.ru
}

function Chevron() {
  return (
    <span
      className="text-[9px] text-on-surface-variant transition-transform duration-200 group-open/x:rotate-180"
      aria-hidden
    >
      ▾
    </span>
  )
}

function PhasePlanCard({ phase, lang }: { phase: RoadmapMvpPhase; lang: Lang }) {
  const { t } = useTranslation()
  const current = phase.current === true
  return (
    <li
      className={cn(
        'rounded-lg border bg-surface-container-lowest/50',
        current
          ? 'border-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30'
          : 'border-surface-variant/90',
      )}
    >
      <details className="group/x [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 hover:bg-surface-container-low/40">
          <span
            className={cn(
              'shrink-0 text-[11px] font-semibold uppercase tracking-wide',
              current ? 'text-emerald-300' : 'text-on-surface-variant',
            )}
          >
            {t('settings.roadmapPhaseBadge', { n: phase.id })}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface">
            {pickLocale(phase.title, lang)}
          </span>
          {current ? (
            <span className="inline-flex shrink-0 animate-pulse items-center rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              {t('settings.roadmapPlanNow')}
            </span>
          ) : null}
          <Chevron />
        </summary>
        <div className="border-t border-surface-variant/80 px-3 pb-3 pt-2">
          <p className="text-xs leading-relaxed text-on-surface-variant">{pickLocale(phase.summary, lang)}</p>
          {phase.plain ? (
            <p className="mt-2 border-l-2 border-surface-variant/80 pl-3 text-xs leading-relaxed text-on-surface-variant">
              <span className="font-medium">{t('settings.roadmapReleaseNotePlain')} </span>
              {pickLocale(phase.plain, lang)}
            </p>
          ) : null}
          {phase.detailBullets.length ? (
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[11px] leading-relaxed text-on-surface-variant">
              {phase.detailBullets.map((b, i) => (
                <li key={i}>{pickLocale(b, lang)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </details>
    </li>
  )
}

function IdeaStatusChip({ status }: { status: NonNullable<RoadmapIdeaEntry['status']> }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
        ROADMAP_IDEA_STATUS_META[status].chipClass,
      )}
    >
      {t(`settings.roadmapIdeaStatus_${status}` as const)}
    </span>
  )
}

function IdeaCard({ idea, lang }: { idea: RoadmapIdeaEntry; lang: Lang }) {
  const { t } = useTranslation()
  const bullets = idea.detailBullets ?? []
  const href = ideaLinkHref(idea)
  const title = pickLocale(idea.title, lang)

  return (
    <li className="rounded-lg border border-surface-variant/90 bg-surface-container-lowest/50 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        {href ? (
          <a href={href} className="min-w-0 text-sm font-semibold text-primary/90 hover:text-primary hover:underline">
            {title}
          </a>
        ) : (
          <p className="min-w-0 text-sm font-semibold text-on-surface">{title}</p>
        )}
        {idea.status ? <IdeaStatusChip status={idea.status} /> : null}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">{pickLocale(idea.summary, lang)}</p>
      {bullets.length ? (
        <details className="group/x mt-2 rounded-md border border-surface-variant/80 bg-surface-container-low/35 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low/55">
            <span>{t('settings.roadmapExpandDetails')}</span>
            <Chevron />
          </summary>
          <ul className="list-disc space-y-1.5 border-t border-surface-variant/80 px-5 py-2 pb-3 text-[11px] leading-relaxed text-on-surface-variant">
            {bullets.map((b, i) => (
              <li key={i}>{pickLocale(b, lang)}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  )
}

/** Двухколоночный блок «План MVP» + «Идеи на потом» (Phase 7.5). На `xl+` — две колонки. */
export function RoadmapPlanIdeas({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const lang: Lang = i18n.language === 'en' ? 'en' : 'ru'
  const ideaGroups = useMemo(() => groupIdeasLaterForDisplay(IDEAS_LATER_ENTRIES), [])

  return (
    <div className={cn('grid gap-4 xl:grid-cols-2', className)}>
      <section aria-label={t('settings.roadmapMvp')}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
          <MaterialIcon name="route" size={18} className="text-on-surface-variant" />
          {t('settings.roadmapMvp')}
        </h3>
        <ol className="flex flex-col gap-2">
          {MVP_PHASES_PLANNED.map((phase) => (
            <PhasePlanCard key={phase.id} phase={phase} lang={lang} />
          ))}
        </ol>
      </section>

      <section aria-label={t('settings.roadmapIdeas')}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
          <MaterialIcon name="lightbulb" size={18} className="text-on-surface-variant" />
          {t('settings.roadmapIdeas')}{' '}
          <span className="font-normal tabular-nums text-on-surface-variant">
            ({t('settings.roadmapIdeasCount', { count: IDEAS_LATER_ENTRIES.length })})
          </span>
        </h3>
        <div className="flex flex-col gap-2">
          {ideaGroups.map((g) => (
            <details
              key={g.groupId}
              className="group/x rounded-lg border border-surface-variant/90 bg-surface-container-lowest/40 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low/55">
                <span className="min-w-0 text-left">
                  {t(`settings.roadmapIdeaGroup_${g.groupId}` as const)}{' '}
                  <span className="font-normal tabular-nums">
                    ({t('settings.roadmapIdeasCount', { count: g.ideas.length })})
                  </span>
                </span>
                <Chevron />
              </summary>
              <ul className="flex flex-col gap-2 border-t border-surface-variant/80 px-3 py-3">
                {g.ideas.map((idea, i) => (
                  <IdeaCard key={`${g.groupId}-${i}`} idea={idea} lang={lang} />
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
