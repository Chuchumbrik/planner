import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { IDEAS_LATER_ENTRIES, RELEASE_NOTES_BLOCKS } from '@/data/productRoadmap'
import {
  IDEA_STATUS_ORDER,
  ideaStatusCounts,
  releaseCounts,
  releasesPerWeek,
} from '@/lib/roadmapStats'

const VELOCITY_WEEKS = 12

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-on-surface">{value}</span>
    </div>
  )
}

function StatGroup({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-variant/80 bg-surface-container-lowest/40 px-3 py-2.5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
        <MaterialIcon name={icon} size={14} />
        {title}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

/** Футер-статистика дорожной карты (Phase 7.6): релизы/идеи/обсуждения + sparkline скорости. */
export function RoadmapFooterStats({
  onSparklineClick,
  className,
}: {
  onSparklineClick?: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])

  const releases = useMemo(() => releaseCounts(RELEASE_NOTES_BLOCKS, now), [now])
  const ideas = useMemo(() => ideaStatusCounts(IDEAS_LATER_ENTRIES), [])
  const velocity = useMemo(() => releasesPerWeek(RELEASE_NOTES_BLOCKS, now, VELOCITY_WEEKS), [now])

  return (
    <section
      className={cn('rounded-xl border border-surface-variant/70 bg-surface-container-low/30 p-4', className)}
      aria-label={t('settings.roadmapStatsTitle')}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
        <MaterialIcon name="bar_chart" size={18} className="text-on-surface-variant" />
        {t('settings.roadmapStatsTitle')}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatGroup icon="update" title={t('settings.roadmapStatsReleases')}>
          <StatRow label={t('settings.roadmapStatsTotal')} value={releases.total} />
          <StatRow label={t('settings.roadmapStatsLast7')} value={releases.last7} />
          <StatRow label={t('settings.roadmapStatsLast30')} value={releases.last30} />
        </StatGroup>

        <StatGroup icon="lightbulb" title={t('settings.roadmapStatsIdeas')}>
          {IDEA_STATUS_ORDER.map((s) => (
            <StatRow key={s} label={t(`settings.roadmapIdeaStatus_${s}` as const)} value={ideas[s]} />
          ))}
        </StatGroup>

        <StatGroup icon="forum" title={t('settings.roadmapStatsDiscussions')}>
          {/* Бэкенд обсуждений — Phase 7.8; пока счётчики нулевые. */}
          <StatRow label={t('settings.roadmapStatsDiscOpen')} value={0} />
          <StatRow label={t('settings.roadmapStatsDiscPending')} value={0} />
          <StatRow label={t('settings.roadmapStatsDiscSynced')} value={0} />
        </StatGroup>
      </div>

      <button
        type="button"
        onClick={onSparklineClick}
        className="mt-3 w-full rounded-lg border border-surface-variant/80 bg-surface-container-lowest/40 px-3 py-2 text-left transition-colors hover:bg-surface-container-low/50"
        aria-label={t('settings.roadmapStatsVelocity')}
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
          {t('settings.roadmapStatsVelocity')}
        </p>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={velocity} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <Line
                type="monotone"
                dataKey="count"
                stroke="rgb(16 185 129)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </button>
    </section>
  )
}
