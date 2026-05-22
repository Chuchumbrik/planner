import type { PlannedDayProgress } from '@motivator/core'
import { CHART_CARD_SHELL, CHART_CARD_TITLE } from '@/lib/designClasses'
import { getPlanProgressLabels } from '@/components/PlanDayProgressCaption'
import { PlanProgressRing } from '@/components/PlanProgressRing'
import { useTranslation } from 'react-i18next'

export type PeriodPlanDonutProps = {
  progress: PlannedDayProgress
  /** Заголовок над кольцом */
  title: string
  /** Опционально: диапазон дат под заголовком */
  subtitle?: string
  ringSize?: number
  ringStroke?: number
}

/** Прогресс плана за неделю / месяц — те же доли, что «день», сумма по дням периода до сегодня. */
export function PeriodPlanDonut({
  progress,
  title,
  subtitle,
  ringSize = 120,
  ringStroke = 10,
}: PeriodPlanDonutProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const empty = progress.plannedTaskCount === 0
  const frac = empty ? 0 : progress.doneFraction / progress.plannedTaskCount
  const pctLabels = empty ? null : getPlanProgressLabels(progress, locale)

  const ariaLabel = empty
    ? undefined
    : `${title}. ${t('eod.chartAriaProgress', { ...getPlanProgressLabels(progress, locale) })}`

  return (
    <div
      className={CHART_CARD_SHELL}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel ?? undefined}
    >
      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className={CHART_CARD_TITLE}>{title}</p>
        {subtitle ? (
          <p className="max-w-[16rem] text-center text-[10px] leading-snug text-on-surface-variant">
            {subtitle}
          </p>
        ) : null}
      </div>
      <PlanProgressRing
        frac={frac}
        empty={empty}
        size={ringSize}
        stroke={ringStroke}
        centerLabel={
          pctLabels ? (
            <span
              className={`font-semibold tabular-nums leading-none text-on-surface ${
                ringSize >= 120 ? 'text-lg' : 'text-base'
              }`}
            >
              {t('eod.chartPercentLine', { pct: pctLabels.pctStr })}
            </span>
          ) : undefined
        }
      />
    </div>
  )
}
