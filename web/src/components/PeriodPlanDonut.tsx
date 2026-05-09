import type { PlannedDayProgress } from '@motivator/core'
import { getPlanProgressLabels, PlanDayProgressCaption } from '@/components/PlanDayProgressCaption'
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

  const ariaLabel = empty
    ? undefined
    : `${title}. ${t('eod.chartAriaProgress', { ...getPlanProgressLabels(progress, locale) })}`

  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-3 lg:border-zinc-800/60 lg:bg-zinc-950/30"
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel ?? undefined}
    >
      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
        {subtitle ? (
          <p className="max-w-[16rem] text-center text-[10px] leading-snug text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      <PlanProgressRing frac={frac} empty={empty} size={ringSize} stroke={ringStroke} />
      {empty ? null : <PlanDayProgressCaption progress={progress} />}
    </div>
  )
}
