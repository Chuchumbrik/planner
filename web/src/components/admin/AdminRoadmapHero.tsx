import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { SETTINGS_CARD } from '@/lib/designClasses'
import {
  IDEAS_LATER_ENTRIES,
  IMPLEMENTED_MVP_PHASES,
  MVP_PHASES_PLANNED,
  RELEASE_NOTES_BLOCKS,
  type LocalizedString,
  type RoadmapReleaseTag,
} from '@/data/productRoadmap'
import { isFreshRelease, relativeDayLabel } from '@/lib/relativeTime'
import { RoadmapTagChip } from './RoadmapTagChip'

type Lang = 'ru' | 'en'

function pickLocale(s: LocalizedString, lang: Lang): string {
  return lang === 'en' ? s.en : s.ru
}

function semverTuple(v: string): [number, number, number] {
  const m = v.trim().match(/^(\d+)\.(\d+)\.(\d+)/)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0]
}

function compareSemverDesc(a: string, b: string): number {
  const [a1, a2, a3] = semverTuple(a)
  const [b1, b2, b3] = semverTuple(b)
  return a1 !== b1 ? b1 - a1 : a2 !== b2 ? b2 - a2 : b3 - a3
}

/** Markdown-bold/`code` → plain text для однострочного превью. */
function stripInlineMarkdown(s: string): string {
  return s.replace(/\*\*/g, '').replace(/`/g, '')
}

type LatestRelease = {
  version: string
  tag?: RoadmapReleaseTag
  dateISO: string
  dateLabel: LocalizedString
  firstChange: LocalizedString
}

function findLatestRelease(lang: Lang): LatestRelease | null {
  let best: LatestRelease | null = null
  for (const block of RELEASE_NOTES_BLOCKS) {
    const dateISO = block.dateLabel.ru.trim()
    for (const item of block.items) {
      const version = pickLocale(item.releasedInVersion, lang)
      if (
        !best ||
        dateISO > best.dateISO ||
        (dateISO === best.dateISO && compareSemverDesc(version, best.version) < 0)
      ) {
        best = {
          version,
          tag: item.tag,
          dateISO,
          dateLabel: block.dateLabel,
          firstChange: item.changes[0],
        }
      }
    }
  }
  return best
}

function StatChip({ icon, label, count }: { icon: string; label: string; count: number | null }) {
  const muted = count === null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-surface-variant/80 bg-surface-container-low/50 px-3 py-1 text-xs',
        muted ? 'text-on-surface-variant/60' : 'text-on-surface-variant',
      )}
    >
      <MaterialIcon name={icon} size={14} />
      <span>{label}</span>
      <span className="tabular-nums font-semibold">{muted ? '—' : count}</span>
    </span>
  )
}

type AdminRoadmapHeroProps = {
  /** Прокрутка к полному changelog (секция ниже Hero). */
  onShowChangelog?: () => void
  className?: string
}

/** Hero-блок страницы `/admin/roadmap` (Phase 7.2): статус MVP + свежий релиз + текущий фокус + quick-links. */
export function AdminRoadmapHero({ onShowChangelog, className }: AdminRoadmapHeroProps) {
  const { t, i18n } = useTranslation()
  const lang: Lang = i18n.language === 'en' ? 'en' : 'ru'
  const now = new Date()

  const { mvpPct, currentPhaseN, phasesTotal } = useMemo(() => {
    const shipped = IMPLEMENTED_MVP_PHASES.length
    const total = shipped + MVP_PHASES_PLANNED.length
    const current = MVP_PHASES_PLANNED.find((p) => p.current)
    return {
      mvpPct: total === 0 ? 0 : Math.round((shipped / total) * 100),
      currentPhaseN: current?.id ?? shipped,
      phasesTotal: total,
    }
  }, [])

  const currentPhase = useMemo(() => MVP_PHASES_PLANNED.find((p) => p.current) ?? null, [])
  const latest = useMemo(() => findLatestRelease(lang), [lang])

  const releaseItemsTotal = useMemo(
    () => RELEASE_NOTES_BLOCKS.reduce((sum, b) => sum + b.items.length, 0),
    [],
  )

  const fresh = latest ? isFreshRelease(latest.dateISO, now) : false

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="grid gap-3 md:grid-cols-3">
        {/* Status card */}
        <article className={cn(SETTINGS_CARD, 'flex flex-col gap-2')}>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MaterialIcon name="emoji_events" size={18} className="text-emerald-400" filled />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              {t('settings.roadmapHeroStatusTitle')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-headline-md tabular-nums text-emerald-300">{mvpPct}%</span>
            <span className="text-xs text-on-surface-variant">
              {t('settings.roadmapHeroPhaseOf', { n: currentPhaseN, total: phasesTotal })}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant/70" aria-hidden>
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${mvpPct}%` }} />
          </div>
        </article>

        {/* What's new card */}
        <article className={cn(SETTINGS_CARD, 'flex flex-col gap-2', fresh && 'ring-1 ring-amber-400/40')}>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MaterialIcon name="rocket_launch" size={18} className="text-amber-300" filled />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              {t('settings.roadmapHeroWhatsNew')}
            </span>
            {fresh ? (
              <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                ✨ {t('settings.roadmapHeroFresh')}
              </span>
            ) : null}
          </div>
          {latest ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-title-md tabular-nums text-on-surface">{latest.version}</span>
                {latest.tag ? <RoadmapTagChip tag={latest.tag} /> : null}
                <span className="text-xs text-on-surface-variant">
                  {relativeDayLabel(latest.dateISO, now, lang)}
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
                {stripInlineMarkdown(pickLocale(latest.firstChange, lang))}
              </p>
              <button
                type="button"
                onClick={onShowChangelog}
                className="mt-auto self-start text-xs font-medium text-primary/90 hover:text-primary"
              >
                {t('settings.roadmapHeroFullChangelog')} ↓
              </button>
            </>
          ) : (
            <p className="text-xs text-on-surface-variant">{t('settings.roadmapHeroNoReleases')}</p>
          )}
        </article>

        {/* Current focus card */}
        <article className={cn(SETTINGS_CARD, 'flex flex-col gap-2')}>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MaterialIcon name="radio_button_checked" size={18} className="text-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              {t('settings.roadmapHeroCurrentFocus')}
            </span>
          </div>
          {currentPhase ? (
            <>
              <p className="text-sm font-semibold text-on-surface">
                {t('settings.roadmapHeroFocusPhase', {
                  n: currentPhase.id,
                  title: pickLocale(currentPhase.title, lang),
                })}
              </p>
              <p className="line-clamp-3 text-xs leading-relaxed text-on-surface-variant">
                {pickLocale(currentPhase.summary, lang)}
              </p>
            </>
          ) : (
            <p className="text-xs text-on-surface-variant">{t('settings.roadmapHeroNoCurrent')}</p>
          )}
        </article>
      </div>

      {/* Quick links bar — counters. Навигация к секциям подключается в 7.3+ (Timeline/2-col/Discussions). */}
      <div className="flex flex-wrap gap-2">
        <StatChip icon="update" label={t('settings.roadmapQuickHistory')} count={releaseItemsTotal} />
        <StatChip icon="route" label={t('settings.roadmapQuickPlan')} count={MVP_PHASES_PLANNED.length} />
        <StatChip icon="lightbulb" label={t('settings.roadmapQuickIdeas')} count={IDEAS_LATER_ENTRIES.length} />
        <StatChip icon="forum" label={t('settings.roadmapQuickDiscussions')} count={null} />
      </div>
    </div>
  )
}
