import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { plannedDayCompletionWeights, type Task } from '@motivator/core'

/** Кольцо: доля выполненных единиц прогресса (задачи и пункты чек-листа). */
function PlanCompletionRing({ frac, empty }: { frac: number; empty: boolean }) {
  const size = 136
  const stroke = 11
  const cx = size / 2
  const cy = size / 2
  const r = cx - stroke / 2 - 2
  const circ = 2 * Math.PI * r
  const dashDone = empty ? 0 : frac * circ
  const dashRest = circ - dashDone

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgb(39 39 42)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {!empty ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(5 150 105)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dashDone} ${dashRest}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(63 63 70)"
          strokeWidth={stroke}
          strokeDasharray="6 8"
        />
      )}
    </svg>
  )
}

export type DayPlanDonutProps = {
  /** Задачи плана на день — как в списке на экране (после фильтров). */
  plannedTasksForDay: Task[]
  /** Локальный календарный день вкладки «День» */
  dayKey: string
}

export function DayPlanDonut({ plannedTasksForDay, dayKey }: DayPlanDonutProps) {
  const { t } = useTranslation()

  const { doneUnits, totalUnits } = useMemo(
    () => plannedDayCompletionWeights(plannedTasksForDay, dayKey),
    [plannedTasksForDay, dayKey],
  )

  const empty = totalUnits === 0
  const frac = empty ? 0 : doneUnits / totalUnits

  const ariaLabel =
    empty
      ? t('eod.chartEmptyPlan')
      : t('eod.chartSummary', { done: doneUnits, total: totalUnits })

  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-3 lg:border-zinc-800/60 lg:bg-zinc-950/30"
      role="img"
      aria-label={ariaLabel}
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {t('eod.chartTitle')}
      </p>
      <PlanCompletionRing frac={frac} empty={empty} />
      <p className="max-w-[14rem] text-center text-xs leading-snug text-zinc-400">
        {empty
          ? t('eod.chartEmptyPlan')
          : t('eod.chartSummary', { done: doneUnits, total: totalUnits })}
      </p>
    </div>
  )
}
