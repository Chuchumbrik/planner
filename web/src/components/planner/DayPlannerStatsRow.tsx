import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  STAT_CARD,
  STAT_CARD_LABEL,
  STAT_CARD_VALUE,
} from '@/lib/designClasses'
import type { PlannedDayProgress } from '@motivator/core'

type DayPlannerStatsRowProps = {
  progress: PlannedDayProgress
  doneCount: number
  eodEnabled: boolean
  eodClosedForDay: boolean
  selectedDay: string
  todayKey: string
  onEodClick?: () => void
  eodClickDisabled?: boolean
  eodActionLabel?: string
}

function StatTile({
  icon,
  iconClass,
  label,
  value,
  sub,
  onClick,
  actionLabel,
  disabled,
}: {
  icon: string
  iconClass?: string
  label: string
  value: string
  sub?: string
  onClick?: () => void
  actionLabel?: string
  disabled?: boolean
}) {
  const className = cn(
    STAT_CARD,
    'flex min-h-[6.875rem] w-full flex-col justify-between snap-start text-left',
    onClick &&
      'cursor-pointer transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40',
  )
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <MaterialIcon name={icon} className={iconClass ?? 'text-primary'} size={22} />
        {sub ? <span className="text-mono-data text-primary">{sub}</span> : null}
      </div>
      <div className="mt-sm">
        <p className={STAT_CARD_LABEL}>{label}</p>
        <p className={cn(STAT_CARD_VALUE, 'mt-0.5 text-base')}>{value}</p>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-label={actionLabel ?? label}
      >
        {body}
      </button>
    )
  }

  return <article className={className}>{body}</article>
}

export function DayPlannerStatsRow({
  progress,
  doneCount,
  eodEnabled,
  eodClosedForDay,
  selectedDay,
  todayKey,
  onEodClick,
  eodClickDisabled,
  eodActionLabel,
}: DayPlannerStatsRowProps) {
  const { t } = useTranslation()

  const pct = useMemo(() => {
    if (progress.plannedTaskCount === 0) return 0
    return Math.round((100 * progress.doneFraction) / progress.plannedTaskCount)
  }, [progress])

  const doneTasks = doneCount

  const eodLabel = useMemo(() => {
    if (!eodEnabled) return null
    if (selectedDay > todayKey) return t('app.dayStatsEodFuture')
    if (eodClosedForDay) return t('app.dayStatsEodClosed')
    if (selectedDay === todayKey) return t('app.dayStatsEodOpen')
    return t('app.dayStatsEodPastOpen')
  }, [eodEnabled, eodClosedForDay, selectedDay, todayKey, t])

  const eodClickable = eodEnabled && selectedDay <= todayKey && Boolean(onEodClick)

  return (
    <section className="flex flex-col gap-4" aria-label={t('app.dayStatsAria')}>
      {progress.plannedTaskCount > 0 ? (
        <div className="motivator-card p-sm md:p-md">
          <div className="flex items-center justify-between gap-3">
            <span className="text-label-sm uppercase text-primary">{t('app.dayStatsProgress')}</span>
            <span className="text-mono-data text-on-surface-variant">{pct}%</span>
          </div>
          <div
            className="mt-sm h-1 overflow-hidden rounded-full bg-surface-container-highest"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('app.dayStatsProgress')}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="scrollbar-site flex snap-x snap-mandatory gap-sm overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        <StatTile
          icon="task_alt"
          label={t('app.dayStatsTasks')}
          value={t('app.dayStatsTasksValue', {
            done: doneTasks,
            total: progress.plannedTaskCount,
          })}
          sub={progress.plannedTaskCount > 0 ? `${pct}%` : undefined}
        />
        <StatTile
          icon="donut_large"
          iconClass="text-primary"
          label={t('app.dayStatsCompletion')}
          value={
            progress.plannedTaskCount === 0
              ? t('app.dayStatsNoPlan')
              : t('app.dayStatsPercent', { pct })
          }
        />
        {eodEnabled ? (
          <StatTile
            icon={eodClosedForDay ? 'nightlight' : 'wb_twilight'}
            iconClass={eodClosedForDay ? 'text-primary' : 'text-tertiary'}
            label={t('app.dayStatsEod')}
            value={eodLabel ?? '—'}
            onClick={eodClickable ? onEodClick : undefined}
            disabled={eodClickDisabled}
            actionLabel={eodActionLabel}
          />
        ) : (
          <StatTile
            icon="calendar_today"
            label={t('app.dayStatsDay')}
            value={
              selectedDay === todayKey ? t('app.today') : selectedDay
            }
          />
        )}
      </div>
    </section>
  )
}
