import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type PeriodPlanBreakdownRow = { name: string; pct: number }

type Props = {
  rows: PeriodPlanBreakdownRow[]
  title: string
  /** Узкая колонка рядом с кольцом (неделя на мобилке): ниже график, уже ось Y */
  compact?: boolean
}

export function PeriodPlanBreakdownChart({ rows, title, compact = false }: Props) {
  const { t } = useTranslation()

  const data = useMemo(
    () =>
      rows.map((r) => ({
        name: r.name,
        nameShort: r.name.length > 14 ? `${r.name.slice(0, 13)}…` : r.name,
        pct: r.pct,
      })),
    [rows],
  )

  if (data.length === 0) return null

  const yAxisWidth = compact ? 56 : 92
  const chartHeightClass = compact
    ? 'mt-1.5 h-[min(200px,34vh)] w-full min-w-0 lg:mt-2 lg:h-[min(220px,40vh)] lg:min-h-[240px]'
    : 'mt-2 h-[min(220px,40vh)] w-full min-w-0 sm:h-[240px]'

  const shellClass = compact
    ? 'flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-2 py-2 lg:border-zinc-800/60 lg:bg-zinc-950/30 lg:py-3'
    : 'w-full min-w-0 rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-2 py-3 lg:border-zinc-800/60 lg:bg-zinc-950/30'

  return (
    <div className={shellClass}>
      <p className="px-1 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <div className={chartHeightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: compact ? 6 : 12, left: compact ? 2 : 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#a1a1aa', fontSize: compact ? 9 : 10 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="nameShort"
              width={yAxisWidth}
              tick={{ fill: '#d4d4d8', fontSize: compact ? 9 : 10 }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, t('app.periodBreakdownDone')]}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as { name?: string } | undefined
                return row?.name ?? ''
              }}
              contentStyle={{
                background: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="pct" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
