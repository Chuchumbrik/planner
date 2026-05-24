import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getPlanProgressLabels } from '@/components/PlanDayProgressCaption'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { STAT_CARD, STAT_CARD_LABEL, STAT_CARD_VALUE } from '@/lib/designClasses'
import type { PlannedDayProgress } from '@motivator/core'

type PeriodPlannerStatsRowProps = {
  mode: 'week' | 'month'
  progress: PlannedDayProgress
  periodLabel: string
  overdueCount: number
}

function StatTile({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: string
  iconClass?: string
  label: string
  value: string
}) {
  return (
    <article className={cn(STAT_CARD, 'flex min-h-[6.875rem] flex-col justify-between snap-start')}>
      <MaterialIcon name={icon} className={iconClass ?? 'text-primary'} size={22} />
      <div className="mt-sm">
        <p className={STAT_CARD_LABEL}>{label}</p>
        <p className={cn(STAT_CARD_VALUE, 'mt-0.5 text-base')}>{value}</p>
      </div>
    </article>
  )
}

export function PeriodPlannerStatsRow({
  mode,
  progress,
  periodLabel,
  overdueCount,
}: PeriodPlannerStatsRowProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const pct = useMemo(() => {
    if (progress.plannedTaskCount === 0) return 0
    return Math.round((100 * progress.doneFraction) / progress.plannedTaskCount)
  }, [progress])

  const closedValue = useMemo(() => {
    if (progress.plannedTaskCount === 0) return '—'
    const { doneSumStr, taskCountStr } = getPlanProgressLabels(progress, locale)
    return t('app.dayStatsTasksValue', { done: doneSumStr, total: taskCountStr })
  }, [progress, locale, t])

  const ariaKey = mode === 'week' ? 'app.weekStatsAria' : 'app.monthStatsAria'

  return (
    <section className="mb-md space-y-sm" aria-label={t(ariaKey)}>
      {progress.plannedTaskCount > 0 ? (
        <div className="motivator-card p-sm md:p-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-label-sm uppercase text-primary">
              {mode === 'week' ? t('app.weekStatsProgress') : t('app.monthStatsProgress')}
            </span>
            <span className="text-mono-data text-on-surface-variant">{periodLabel}</span>
          </div>
          <div className="mt-sm flex items-center gap-3">
            <div
              className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container-highest"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-mono-data text-on-surface">{pct}%</span>
          </div>
        </div>
      ) : null}

      <div className="scrollbar-site -mx-margin-mobile flex snap-x snap-mandatory gap-sm overflow-x-auto px-margin-mobile pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        <StatTile
          icon="donut_large"
          label={mode === 'week' ? t('app.weekStatsSlots') : t('app.monthStatsSlots')}
          value={
            progress.plannedTaskCount === 0
              ? t('app.dayStatsNoPlan')
              : String(progress.plannedTaskCount)
          }
        />
        <StatTile
          icon="task_alt"
          label={t('app.periodStatsCompletion')}
          value={closedValue}
        />
        <StatTile
          icon="schedule"
          iconClass={overdueCount > 0 ? 'text-tertiary' : 'text-on-surface-variant'}
          label={t('app.periodStatsOverdue')}
          value={
            overdueCount > 0
              ? t('app.periodStatsOverdueCount', { count: overdueCount })
              : t('app.periodStatsOverdueNone')
          }
        />
      </div>
    </section>
  )
}
