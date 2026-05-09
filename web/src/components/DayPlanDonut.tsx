import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { plannedDayCompletionWeights, type Task } from '@motivator/core'
import { getPlanProgressLabels, PlanDayProgressCaption } from '@/components/PlanDayProgressCaption'
import { PlanProgressRing } from '@/components/PlanProgressRing'

export type DayPlanDonutProps = {
  /** Задачи плана на день — как в списке на экране (после фильтров). */
  plannedTasksForDay: Task[]
  /** Локальный календарный день вкладки «День» */
  dayKey: string
}

export function DayPlanDonut({ plannedTasksForDay, dayKey }: DayPlanDonutProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const progress = useMemo(
    () => plannedDayCompletionWeights(plannedTasksForDay, dayKey),
    [plannedTasksForDay, dayKey],
  )

  const empty = progress.plannedTaskCount === 0
  const frac = empty ? 0 : progress.doneFraction / progress.plannedTaskCount

  const ariaLabel = empty
    ? t('eod.chartEmptyPlan')
    : t('eod.chartAriaProgress', {
        ...getPlanProgressLabels(progress, locale),
      })

  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-3 lg:border-zinc-800/60 lg:bg-zinc-950/30"
      role="img"
      aria-label={ariaLabel}
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {t('eod.chartTitle')}
      </p>
      <PlanProgressRing frac={frac} empty={empty} />
      {empty ? (
        <p className="max-w-[14rem] text-center text-xs leading-snug text-zinc-400">
          {t('eod.chartEmptyPlan')}
        </p>
      ) : (
        <PlanDayProgressCaption progress={progress} />
      )}
    </div>
  )
}
