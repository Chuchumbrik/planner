import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { plannedDayCompletionWeights, type Task } from '@motivator/core'
import { CHART_CARD_SHELL, CHART_CARD_TITLE } from '@/lib/designClasses'
import { getPlanProgressLabels } from '@/components/PlanDayProgressCaption'
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
  const pctLabels = empty ? null : getPlanProgressLabels(progress, locale)

  const ariaLabel = empty
    ? t('eod.chartEmptyPlan')
    : t('eod.chartAriaProgress', {
        ...getPlanProgressLabels(progress, locale),
      })

  return (
    <div className={CHART_CARD_SHELL} role="img" aria-label={ariaLabel}>
      <p className={CHART_CARD_TITLE}>{t('eod.chartTitle')}</p>
      <PlanProgressRing
        frac={frac}
        empty={empty}
        centerLabel={
          pctLabels ? (
            <span className="text-lg font-semibold tabular-nums leading-none text-on-surface">
              {t('eod.chartPercentLine', { pct: pctLabels.pctStr })}
            </span>
          ) : undefined
        }
      />
      {empty ? (
        <p className="max-w-[14rem] text-center text-xs leading-snug text-on-surface-variant">
          {t('eod.chartEmptyPlan')}
        </p>
      ) : null}
    </div>
  )
}
