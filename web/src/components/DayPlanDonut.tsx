import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { partitionEodTasksByCompletion, type Task } from '@motivator/core'

/** Кольцо: доля закрытых задач среди запланированных на календарный день (та же логика, что в ритуале EOD). */
function PlanCompletionRing({ done, remaining }: { done: number; remaining: number }) {
  const total = done + remaining
  const size = 112
  const stroke = 10
  const cx = size / 2
  const cy = size / 2
  const r = cx - stroke / 2 - 2
  const circ = 2 * Math.PI * r
  const frac = total === 0 ? 0 : done / total
  const dashDone = frac * circ
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
      {total > 0 ? (
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
  tasks: Task[]
  /** Локальный календарный день вкладки «День» */
  dayKey: string
}

export function DayPlanDonut({ tasks, dayKey }: DayPlanDonutProps) {
  const { t } = useTranslation()

  const { completed, remaining } = useMemo(
    () => partitionEodTasksByCompletion(tasks, dayKey),
    [tasks, dayKey],
  )
  const plannedTotal = completed.length + remaining.length

  const ariaLabel =
    plannedTotal === 0
      ? t('eod.chartEmptyPlan')
      : t('eod.chartSummary', { done: completed.length, total: plannedTotal })

  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-3 lg:border-zinc-800/60 lg:bg-zinc-950/30"
      role="img"
      aria-label={ariaLabel}
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {t('eod.chartTitle')}
      </p>
      <PlanCompletionRing done={completed.length} remaining={remaining.length} />
      <p className="max-w-[14rem] text-center text-xs leading-snug text-zinc-400">
        {plannedTotal === 0
          ? t('eod.chartEmptyPlan')
          : t('eod.chartSummary', { done: completed.length, total: plannedTotal })}
      </p>
    </div>
  )
}
