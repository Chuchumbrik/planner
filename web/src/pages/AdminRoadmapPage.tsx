import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AdminRoadmapHero } from '@/components/admin/AdminRoadmapHero'
import { RoadmapPlanIdeas } from '@/components/admin/RoadmapPlanIdeas'
import { RoadmapSearchBar } from '@/components/admin/RoadmapSearchBar'
import { RoadmapTimeline } from '@/components/admin/RoadmapTimeline'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { ProductRoadmapPanel } from '@/components/ProductRoadmapPanel'
import { RequireVault } from '@/components/RequireVault'
import { RELEASE_NOTES_BLOCKS, type RoadmapReleaseTag } from '@/data/productRoadmap'
import { SETTINGS_TAB_PANEL_INTRO, SETTINGS_TAB_PANEL_TITLE } from '@/lib/designClasses'
import { groupReleasesByDay } from '@/lib/roadmapTimeline'
import {
  applyFilter,
  filterToParams,
  isFilterActive,
  parseFilterFromParams,
  type RoadmapFilter,
} from '@/lib/roadmapFilter'

function AdminRoadmapPageInner() {
  const { t, i18n } = useTranslation()
  const lang: 'ru' | 'en' = i18n.language === 'en' ? 'en' : 'ru'
  const timelineRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const scrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const allGroups = useMemo(() => groupReleasesByDay(RELEASE_NOTES_BLOCKS), [])
  const versions = useMemo(
    () => allGroups.flatMap((g) => g.items.map((i) => i.releasedInVersion.ru)),
    [allGroups],
  )

  const filter = useMemo(() => parseFilterFromParams(searchParams), [searchParams])
  const { groups: filteredGroups, matched, total } = useMemo(
    () => applyFilter(allGroups, filter, lang),
    [allGroups, filter, lang],
  )
  const filterActive = isFilterActive(filter)

  const update = useCallback(
    (mut: (f: RoadmapFilter) => RoadmapFilter) => {
      setSearchParams(filterToParams(mut(parseFilterFromParams(searchParams))), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const onQueryChange = useCallback((q: string) => update((f) => ({ ...f, q })), [update])
  const onToggleTag = useCallback(
    (tag: RoadmapReleaseTag) =>
      update((f) => ({
        ...f,
        tags: f.tags.includes(tag) ? f.tags.filter((x) => x !== tag) : [...f.tags, tag],
      })),
    [update],
  )
  const onSetFrom = useCallback((v: string | null) => update((f) => ({ ...f, from: v })), [update])
  const onSetTo = useCallback((v: string | null) => update((f) => ({ ...f, to: v })), [update])
  const onReset = useCallback(
    () => setSearchParams(new URLSearchParams(), { replace: true }),
    [setSearchParams],
  )

  return (
    <MotivatorShell activeNav="prototype-admin" wide align="left" title={t('settings.roadmapTitle')}>
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-md">
          <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t('settings.roadmapTitle')}</h2>
          <p className={SETTINGS_TAB_PANEL_INTRO}>{t('admin.roadmapIntro')}</p>
        </header>
        <AdminRoadmapHero className="mb-6" onShowChangelog={scrollToTimeline} />
        <RoadmapSearchBar
          filter={filter}
          versions={versions}
          matched={matched}
          total={total}
          onQueryChange={onQueryChange}
          onToggleTag={onToggleTag}
          onSetFrom={onSetFrom}
          onSetTo={onSetTo}
          onReset={onReset}
        />
        <div ref={timelineRef} className="mb-6 mt-4 scroll-mt-4">
          <RoadmapTimeline groups={filteredGroups} filterActive={filterActive} />
        </div>
        <RoadmapPlanIdeas className="mb-6" />
        <ProductRoadmapPanel showReleaseNotes={false} showPlanIdeas={false} />
      </div>
    </MotivatorShell>
  )
}

export function AdminRoadmapPage() {
  return (
    <RequireVault>
      <AdminRoadmapPageInner />
    </RequireVault>
  )
}
