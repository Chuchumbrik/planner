import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  aggregateRecurringMisses,
  completionDayRate,
  consecutiveDr013DaysEndingOn,
  dailyCompletionBuckets,
  reportsWindowKeys,
  topOneOffMissesInWindow,
  totalCompletionMarksInRange,
} from '@motivator/core'
import { ReportHint } from '@/components/ReportHint'
import { RequireVault } from '@/components/RequireVault'
import { useVault } from '@/vault/VaultProvider'

function formatDayLabel(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  try {
    return dt.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}

function ReportsPageInner() {
  const { t, i18n } = useTranslation()
  const { vault } = useVault()
  const [periodDays, setPeriodDays] = useState<7 | 30>(7)

  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU'

  const analytics = useMemo(() => {
    const { todayKey, fromKey, toKey } = reportsWindowKeys(periodDays)
    const tasks = vault.tasks
    const eodSet = new Set(vault.eodCompletedLocalDates ?? [])
    const buckets = dailyCompletionBuckets(tasks, fromKey, toKey)
    const rate = completionDayRate(tasks, fromKey, toKey)
    const streak = consecutiveDr013DaysEndingOn(tasks, todayKey, eodSet)
    const totalMarks = totalCompletionMarksInRange(tasks, fromKey, toKey)
    const recurringFails = aggregateRecurringMisses(tasks, fromKey, toKey, todayKey)
    const oneOffFails = topOneOffMissesInWindow(tasks, fromKey, toKey, todayKey, 5)
    const maxBar = Math.max(1, ...buckets.map((b) => b.count))
    return {
      todayKey,
      fromKey,
      toKey,
      buckets,
      rate,
      streak,
      totalMarks,
      recurringFails,
      oneOffFails,
      maxBar,
    }
  }, [vault.tasks, vault.eodCompletedLocalDates, periodDays])

  const pct = Math.round(analytics.rate.ratio * 100)

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-8">
      <header className="mb-6">
        <Link to="/app" className="text-sm text-emerald-400 hover:text-emerald-300">
          {t('reports.backToPlanner')}
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-white">{t('reports.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{t('reports.subtitle')}</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-zinc-700 bg-zinc-900/50 p-0.5">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              periodDays === 7 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => setPeriodDays(7)}
          >
            {t('reports.period7')}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              periodDays === 30 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => setPeriodDays(30)}
          >
            {t('reports.period30')}
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          {t('reports.windowHint', {
            from: formatDayLabel(analytics.fromKey, locale),
            to: formatDayLabel(analytics.toKey, locale),
          })}
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('reports.kpiStreak')}
            </p>
            <ReportHint label={t('reports.hintKpiStreak')} />
          </div>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">{analytics.streak}</p>
          <p className="mt-2 text-[11px] leading-snug text-zinc-500">{t('reports.kpiStreakHint')}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('reports.kpiCompletionRate')}
            </p>
            <ReportHint label={t('reports.hintKpiCompletionRate')} />
          </div>
          <p className="mt-1 text-2xl font-semibold text-cyan-400/95">
            {t('reports.kpiCompletionRateValue', { pct })}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {analytics.rate.daysWithCompletion}/{analytics.rate.totalDays}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('reports.kpiTotalMarks')}
            </p>
            <ReportHint label={t('reports.hintKpiTotalMarks')} />
          </div>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{analytics.totalMarks}</p>
        </div>
      </div>

      <section className="mb-8 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 text-sm font-semibold text-zinc-200">{t('reports.chartTitle')}</h2>
          <ReportHint label={t('reports.hintChartDaily')} />
        </div>
        {analytics.buckets.every((b) => b.count === 0) ? (
          <p className="mt-4 text-sm text-zinc-500">{t('reports.chartEmpty')}</p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-1 overflow-x-auto pb-2 pt-2">
            {analytics.buckets.map((b) => (
              <div
                key={b.dateKey}
                className="flex min-w-[2rem] flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full max-w-[3rem] rounded-t bg-emerald-600/85"
                  style={{
                    height: `${Math.max(6, (b.count / analytics.maxBar) * 100)}%`,
                    minHeight: b.count > 0 ? '12px' : '4px',
                  }}
                  title={`${b.dateKey}: ${b.count}`}
                />
                <span className="max-w-full truncate text-[10px] text-zinc-500">
                  {b.dateKey.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-lg border border-amber-900/35 bg-amber-950/15 p-4">
        <h2 className="text-sm font-semibold text-amber-200/90">{t('reports.dr013Title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-100/70">{t('reports.dr013Body')}</p>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-start gap-2">
          <h2 className="min-w-0 flex-1 text-sm font-semibold text-zinc-200">
            {t('reports.failedRecurringTitle')}
          </h2>
          <ReportHint label={t('reports.hintFailedRecurring')} />
        </div>
        {analytics.recurringFails.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('reports.emptyFailed')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('reports.colTask')}</th>
                  <th className="px-3 py-2 font-medium">{t('reports.colMisses')}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recurringFails.map((row) => (
                  <tr key={row.seriesId} className="border-b border-zinc-800/80 last:border-0">
                    <td className="max-w-[18rem] truncate px-3 py-2 text-zinc-200">
                      {row.task.title.trim() || '—'}
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{row.missedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-start gap-2">
          <h2 className="min-w-0 flex-1 text-sm font-semibold text-zinc-200">
            {t('reports.failedOneOffTitle')}
          </h2>
          <ReportHint label={t('reports.hintFailedOneOff')} />
        </div>
        {analytics.oneOffFails.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('reports.emptyFailed')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('reports.colTask')}</th>
                  <th className="px-3 py-2 font-medium">{t('reports.colPlannedDate')}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.oneOffFails.map(({ task, scheduledLocalDate }) => (
                  <tr key={task.id} className="border-b border-zinc-800/80 last:border-0">
                    <td className="max-w-[18rem] truncate px-3 py-2 text-zinc-200">
                      {task.title.trim() || '—'}
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{scheduledLocalDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export function ReportsPage() {
  return (
    <RequireVault>
      <ReportsPageInner />
    </RequireVault>
  )
}
