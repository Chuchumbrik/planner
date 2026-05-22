import { CHART_BREAKDOWN_SHELL, CHART_BREAKDOWN_SHELL_COMPACT, CHART_CARD_TITLE } from '@/lib/designClasses'
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

  const shellClass = compact ? CHART_BREAKDOWN_SHELL_COMPACT : CHART_BREAKDOWN_SHELL

  return (
    <div className={shellClass}>
      <p className={`${CHART_CARD_TITLE} px-1`}>
        {title}
      </p>
      <div className={chartHeightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: compact ? 6 : 12, left: compact ? 2 : 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#353437" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#9e9da3', fontSize: compact ? 9 : 10 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="nameShort"
              width={yAxisWidth}
              tick={{ fill: '#e6e1e6', fontSize: compact ? 9 : 10 }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, t('app.periodBreakdownDone')]}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as { name?: string } | undefined
                return row?.name ?? ''
              }}
              contentStyle={{
                background: '#201f22',
                border: '1px solid #353437',
                borderRadius: 8,
                fontSize: 12,
                color: '#e6e1e6',
              }}
            />
            <Bar dataKey="pct" fill="#4edea3" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
