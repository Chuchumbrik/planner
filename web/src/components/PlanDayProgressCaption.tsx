import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlannedDayProgress } from '@motivator/core'

export function getPlanProgressLabels(progress: PlannedDayProgress, locale: string) {
  const pctRaw = (progress.doneFraction / progress.plannedTaskCount) * 100
  const pctStr = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(pctRaw)
  const doneStr = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(progress.doneFraction)
  const totalStr = String(progress.plannedTaskCount)
  return { pctStr, doneStr, totalStr }
}

type Props = {
  progress: PlannedDayProgress
  emptyClassName?: string
}

/** Подпись под кольцом: крупно процент, ниже дробь «выполнено по задачам / число задач». */
export function PlanDayProgressCaption({ progress, emptyClassName }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const labels = useMemo(
    () =>
      progress.plannedTaskCount === 0
        ? null
        : getPlanProgressLabels(progress, locale),
    [progress, locale],
  )

  if (!labels) {
    return (
      <p
        className={
          emptyClassName ??
          'max-w-[14rem] text-center text-xs leading-snug text-zinc-400'
        }
      >
        {t('eod.chartEmptyPlan')}
      </p>
    )
  }

  return (
    <div className="flex max-w-[15rem] flex-col items-center gap-0.5 text-center">
      <p className="text-lg font-semibold tabular-nums text-zinc-100">
        {t('eod.chartPercentLine', { pct: labels.pctStr })}
      </p>
      <p className="text-[11px] leading-snug text-zinc-400">
        {t('eod.chartTaskFraction', { done: labels.doneStr, total: labels.totalStr })}
      </p>
    </div>
  )
}
