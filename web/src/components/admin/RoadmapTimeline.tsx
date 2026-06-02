import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import type { LocalizedString, RoadmapReleaseNoteItem } from '@/data/productRoadmap'
import { relativeDayLabel } from '@/lib/relativeTime'
import { splitDayGroupsByItemLimit, versionAnchorId, type RoadmapDayGroup } from '@/lib/roadmapTimeline'
import { RoadmapTagChip } from './RoadmapTagChip'

type Lang = 'ru' | 'en'

const DEFAULT_VISIBLE_ITEMS = 5
const HIGHLIGHT_MS = 800

function pickLocale(s: LocalizedString, lang: Lang): string {
  return lang === 'en' ? s.en : s.ru
}

/** Anchor из URL без `#` (пусто на сервере/без hash). */
function initialAnchorHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, '')
}

/** Phase 7.12 — клавиатурная навигация: перенос фокуса между карточками релизов. */
function navigateCard(current: HTMLElement, direction: 1 | -1) {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-release-card]'))
  const idx = cards.indexOf(current)
  if (idx === -1) return
  cards[idx + direction]?.focus()
}

function Chevron() {
  return (
    <span
      className="text-[9px] text-on-surface-variant transition-transform duration-200 group-open/plain:rotate-180"
      aria-hidden
    >
      ▾
    </span>
  )
}

function ReleaseCard({
  item,
  lang,
  highlighted,
  copied,
  onCopyAnchor,
}: {
  item: RoadmapReleaseNoteItem
  lang: Lang
  highlighted: boolean
  copied: boolean
  onCopyAnchor: (version: string) => void
}) {
  const { t } = useTranslation()
  const version = pickLocale(item.releasedInVersion, lang)
  const anchorId = versionAnchorId(version)

  // Phase 7.12 — a11y: Enter/Space копирует якорь, стрелки переносят фокус по карточкам.
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onCopyAnchor(version)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      navigateCard(e.currentTarget, 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      navigateCard(e.currentTarget, -1)
    }
  }

  return (
    <article
      id={anchorId}
      data-release-card
      tabIndex={0}
      aria-label={version}
      onKeyDown={onKeyDown}
      className={cn(
        'scroll-mt-24 rounded-lg border border-surface-variant/90 bg-surface-container-lowest/45 px-3 py-2.5 transition-shadow duration-500',
        highlighted && 'ring-2 ring-primary/70',
      )}
    >
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-display text-2xl font-semibold tabular-nums text-on-surface">{version}</span>
        {item.tag ? <RoadmapTagChip tag={item.tag} /> : null}
        <button
          type="button"
          onClick={() => onCopyAnchor(version)}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-on-surface-variant hover:bg-surface-container-low/60 hover:text-primary"
          title={t('settings.roadmapTimelineCopyAnchor')}
          aria-label={t('settings.roadmapTimelineCopyAnchor')}
        >
          <MaterialIcon name={copied ? 'check' : 'link'} size={14} />
          {copied ? <span>{t('settings.roadmapTimelineCopied')}</span> : null}
        </button>
      </header>
      <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-on-surface">
        {item.changes.map((c, ci) => (
          <li key={ci} className="marker:text-on-surface-variant">
            {pickLocale(c, lang)}
          </li>
        ))}
      </ul>
      {item.plainBullets?.length ? (
        <details className="group/plain mt-3 rounded-md border border-surface-variant/80 bg-surface-container-low/35 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-2 text-xs font-medium text-primary/85 hover:bg-surface-container-low/55">
            <span>{t('settings.roadmapReleaseNotePlainDetails')}</span>
            <Chevron />
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
    </article>
  )
}

type RoadmapTimelineProps = {
  /** Уже сгруппированные (и при необходимости отфильтрованные) дни. */
  groups: RoadmapDayGroup[]
  /** Активен ли фильтр — тогда лента раскрыта целиком, «Показать ещё» скрыта. */
  filterActive?: boolean
  className?: string
}

/** Вертикальная лента релизов по датам (Phase 7.3). Anchor `#v0.7.15`, copy-ссылка, «Показать ещё». */
export function RoadmapTimeline({ groups, filterActive = false, className }: RoadmapTimelineProps) {
  const { t, i18n } = useTranslation()
  const lang: Lang = i18n.language === 'en' ? 'en' : 'ru'
  const now = new Date()

  const { visible, hiddenItems } = useMemo(
    () => splitDayGroupsByItemLimit(groups, DEFAULT_VISIBLE_ITEMS),
    [groups],
  )

  // Если открыли по anchor #v0.7.15 — сразу раскрываем всю ленту (целевая карточка может быть скрыта).
  const [expanded, setExpanded] = useState(() => /^v\d+\.\d+\.\d+/.test(initialAnchorHash()))
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Anchor-scroll по #v0.7.15 на mount: проскроллить к карточке и подсветить 800ms.
  useEffect(() => {
    const hash = initialAnchorHash()
    if (!/^v\d+\.\d+\.\d+/.test(hash)) return
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(hash)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightId(hash)
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!highlightId) return
    const id = window.setTimeout(() => setHighlightId(null), HIGHLIGHT_MS)
    return () => window.clearTimeout(id)
  }, [highlightId])

  const copyAnchor = (version: string) => {
    const anchor = `#${versionAnchorId(version)}`
    void navigator.clipboard?.writeText(anchor)
    setCopiedId(version)
    window.setTimeout(() => setCopiedId((cur) => (cur === version ? null : cur)), HIGHLIGHT_MS)
  }

  const displayGroups = expanded || filterActive ? groups : visible

  return (
    <section className={cn('flex flex-col gap-4', className)} aria-label={t('settings.roadmapTimelineTitle')}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface">
        <MaterialIcon name="update" size={18} className="text-on-surface-variant" />
        {t('settings.roadmapTimelineTitle')}
      </h3>

      {displayGroups.length === 0 ? (
        <p className="rounded-lg border border-surface-variant/80 bg-surface-container-lowest/40 px-4 py-6 text-center text-sm text-on-surface-variant">
          {t('settings.roadmapSearchEmpty')}
        </p>
      ) : null}

      <ol role="list" className="flex flex-col gap-5">
        {displayGroups.map((day) => (
          <li key={day.dateISO} role="listitem" className="border-l-2 border-surface-variant/70 pl-4">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-base font-semibold tabular-nums text-on-surface">
                {pickLocale(day.dateLabel, lang)}
              </span>
              <span className="text-xs text-on-surface-variant">{relativeDayLabel(day.dateISO, now, lang)}</span>
            </div>
            <div className="flex flex-col gap-3">
              {day.items.map((item) => {
                const version = pickLocale(item.releasedInVersion, lang)
                return (
                  <ReleaseCard
                    key={version}
                    item={item}
                    lang={lang}
                    highlighted={highlightId === versionAnchorId(version)}
                    copied={copiedId === version}
                    onCopyAnchor={copyAnchor}
                  />
                )
              })}
            </div>
          </li>
        ))}
      </ol>

      {hiddenItems > 0 && !filterActive ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start rounded-md border border-surface-variant/80 px-3 py-1.5 text-xs font-medium text-primary/90 hover:bg-surface-container-low/60"
        >
          {expanded
            ? t('settings.roadmapTimelineShowLess')
            : t('settings.roadmapTimelineShowMore', { count: hiddenItems })}
        </button>
      ) : null}
    </section>
  )
}
