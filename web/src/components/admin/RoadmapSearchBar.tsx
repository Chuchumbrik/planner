import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import type { RoadmapReleaseTag } from '@/data/productRoadmap'
import {
  isFilterActive,
  ROADMAP_FILTER_TAGS,
  type RoadmapFilter,
} from '@/lib/roadmapFilter'
import { ROADMAP_TAG_META } from './roadmapTagMeta'

const SEARCH_DEBOUNCE_MS = 250

type RoadmapSearchBarProps = {
  filter: RoadmapFilter
  /** Все версии по убыванию — для range-селектов. */
  versions: string[]
  matched: number
  total: number
  onQueryChange: (q: string) => void
  onToggleTag: (tag: RoadmapReleaseTag) => void
  onSetFrom: (v: string | null) => void
  onSetTo: (v: string | null) => void
  onReset: () => void
}

/** Sticky-бар поиска/фильтра Timeline (Phase 7.4). Состояние — в URL `?q=&tag=&from=&to=`. */
export function RoadmapSearchBar({
  filter,
  versions,
  matched,
  total,
  onQueryChange,
  onToggleTag,
  onSetFrom,
  onSetTo,
  onReset,
}: RoadmapSearchBarProps) {
  const { t } = useTranslation()

  // Локальный ввод с debounce; синхронизация с внешним filter.q (напр. при Reset) — во время рендера.
  const [qInput, setQInput] = useState(filter.q)
  const [prevQ, setPrevQ] = useState(filter.q)
  if (filter.q !== prevQ) {
    setPrevQ(filter.q)
    setQInput(filter.q)
  }

  useEffect(() => {
    if (qInput === filter.q) return
    const id = window.setTimeout(() => onQueryChange(qInput), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [qInput, filter.q, onQueryChange])

  // Лёгкий fade/shadow при скролле.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const active = isFilterActive(filter)

  return (
    <div
      className={cn(
        'sticky top-16 z-10 flex flex-col gap-2 rounded-xl border border-surface-variant/80 bg-surface-container-low/80 px-3 py-2.5 backdrop-blur transition-shadow',
        scrolled && 'shadow-lg shadow-black/20',
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MaterialIcon
            name="search"
            size={16}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={t('settings.roadmapSearchPlaceholder')}
            aria-label={t('settings.roadmapSearchPlaceholder')}
            className="w-full rounded-lg border border-surface-variant/80 bg-surface-container-lowest/60 py-1.5 pl-8 pr-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/60 focus:outline-none"
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-on-surface-variant">
          {t('settings.roadmapSearchCount', { matched, total })}
        </span>
        {active ? (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 rounded-md border border-surface-variant/80 px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container-low/60 hover:text-primary"
          >
            {t('settings.roadmapSearchReset')}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ROADMAP_FILTER_TAGS.map((tag) => {
          const on = filter.tags.includes(tag)
          const meta = ROADMAP_TAG_META[tag]
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleTag(tag)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                on
                  ? meta.chipClass
                  : 'border-surface-variant/70 text-on-surface-variant/70 hover:text-on-surface-variant',
              )}
            >
              <MaterialIcon name={meta.icon} size={12} />
              {tag}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
        <span>{t('settings.roadmapSearchRange')}</span>
        <RangeSelect
          label={t('settings.roadmapSearchFrom')}
          value={filter.from ?? ''}
          versions={versions}
          onChange={(v) => onSetFrom(v || null)}
        />
        <span aria-hidden>—</span>
        <RangeSelect
          label={t('settings.roadmapSearchTo')}
          value={filter.to ?? ''}
          versions={versions}
          onChange={(v) => onSetTo(v || null)}
        />
      </div>
    </div>
  )
}

function RangeSelect({
  label,
  value,
  versions,
  onChange,
}: {
  label: string
  value: string
  versions: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-surface-variant/80 bg-surface-container-lowest/60 px-1.5 py-1 text-xs text-on-surface focus:border-primary/60 focus:outline-none"
    >
      <option value="">{label}</option>
      {versions.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  )
}
