import { useMemo, useState } from 'react'
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
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import {
  ALERT_WARNING_MUTED,
  ALERT_WARNING_BODY,
  ALERT_WARNING_TITLE,
  SETTINGS_CARD,
  SETTINGS_SUBHEAD,
  STAT_KPI_VALUE,
  VIEW_TABLIST,
  viewTab,
} from '@/lib/designClasses'
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
    <MotivatorShell activeNav="reports" wide>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
        {t('reports.subtitle')}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className={VIEW_TABLIST}>
          <button
            type="button"
            className={viewTab(periodDays === 7)}
            onClick={() => setPeriodDays(7)}
          >
            {t('reports.period7')}
          </button>
          <button
            type="button"
            className={viewTab(periodDays === 30)}
            onClick={() => setPeriodDays(30)}
          >
            {t('reports.period30')}
          </button>
        </div>
        <p className="text-xs text-on-surface-variant">
          {t('reports.windowHint', {
            from: formatDayLabel(analytics.fromKey, locale),
            to: formatDayLabel(analytics.toKey, locale),
          })}
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className={SETTINGS_CARD}>
          <div className="flex items-start justify-between gap-2">
            <p className={`min-w-0 flex-1 ${SETTINGS_SUBHEAD} mt-0`}>
              {t('reports.kpiStreak')}
            </p>
            <ReportHint label={t('reports.hintKpiStreak')} />
          </div>
          <p className={`mt-1 ${STAT_KPI_VALUE}`}>{analytics.streak}</p>
          <p className="mt-2 text-[11px] leading-snug text-on-surface-variant">{t('reports.kpiStreakHint')}</p>
        </div>
        <div className={SETTINGS_CARD}>
          <div className="flex items-start justify-between gap-2">
            <p className={`min-w-0 flex-1 ${SETTINGS_SUBHEAD} mt-0`}>
              {t('reports.kpiCompletionRate')}
            </p>
            <ReportHint label={t('reports.hintKpiCompletionRate')} />
          </div>
          <p className={`mt-1 ${STAT_KPI_VALUE}`}>
            {t('reports.kpiCompletionRateValue', { pct })}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {analytics.rate.daysWithCompletion}/{analytics.rate.totalDays}
          </p>
        </div>
        <div className={SETTINGS_CARD}>
          <div className="flex items-start justify-between gap-2">
            <p className={`min-w-0 flex-1 ${SETTINGS_SUBHEAD} mt-0`}>
              {t('reports.kpiTotalMarks')}
            </p>
            <ReportHint label={t('reports.hintKpiTotalMarks')} />
          </div>
          <p className="mt-1 font-display text-2xl font-semibold text-on-surface">{analytics.totalMarks}</p>
        </div>
      </div>

      <section className={`${SETTINGS_CARD} mb-8`}>
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 font-display text-sm font-semibold text-on-surface">
            {t('reports.chartTitle')}
          </h2>
          <ReportHint label={t('reports.hintChartDaily')} />
        </div>
        {analytics.buckets.every((b) => b.count === 0) ? (
          <p className="mt-4 text-sm text-on-surface-variant">{t('reports.chartEmpty')}</p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-1 overflow-x-auto pb-2 pt-2">
            {analytics.buckets.map((b) => (
              <div
                key={b.dateKey}
                className="flex min-w-[2rem] flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full max-w-[3rem] rounded-t bg-primary/85"
                  style={{
                    height: `${Math.max(6, (b.count / analytics.maxBar) * 100)}%`,
                    minHeight: b.count > 0 ? '12px' : '4px',
                  }}
                  title={`${b.dateKey}: ${b.count}`}
                />
                <span className="max-w-full truncate font-mono text-[10px] text-on-surface-variant">
                  {b.dateKey.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`${ALERT_WARNING_MUTED} mb-8`}>
        <h2 className={ALERT_WARNING_TITLE}>{t('reports.dr013Title')}</h2>
        <p className={`mt-2 ${ALERT_WARNING_BODY}`}>{t('reports.dr013Body')}</p>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-start gap-2">
          <h2 className="min-w-0 flex-1 font-display text-sm font-semibold text-on-surface">
            {t('reports.failedRecurringTitle')}
          </h2>
          <ReportHint label={t('reports.hintFailedRecurring')} />
        </div>
        {analytics.recurringFails.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{t('reports.emptyFailed')}</p>
        ) : (
          <div className="motivator-card overflow-x-auto p-0">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-surface-variant bg-surface-container-low font-display text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('reports.colTask')}</th>
                  <th className="px-3 py-2 font-medium">{t('reports.colMisses')}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recurringFails.map((row) => (
                  <tr key={row.seriesId} className="border-b border-surface-variant/80 last:border-0">
                    <td className="max-w-[18rem] truncate px-3 py-2 text-on-surface">
                      {row.task.title.trim() || '—'}
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant">{row.missedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-start gap-2">
          <h2 className="min-w-0 flex-1 font-display text-sm font-semibold text-on-surface">
            {t('reports.failedOneOffTitle')}
          </h2>
          <ReportHint label={t('reports.hintFailedOneOff')} />
        </div>
        {analytics.oneOffFails.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{t('reports.emptyFailed')}</p>
        ) : (
          <div className="motivator-card overflow-x-auto p-0">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-surface-variant bg-surface-container-low font-display text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('reports.colTask')}</th>
                  <th className="px-3 py-2 font-medium">{t('reports.colPlannedDate')}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.oneOffFails.map(({ task, scheduledLocalDate }) => (
                  <tr key={task.id} className="border-b border-surface-variant/80 last:border-0">
                    <td className="max-w-[18rem] truncate px-3 py-2 text-on-surface">
                      {task.title.trim() || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-on-surface-variant">{scheduledLocalDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </MotivatorShell>
  )
}

export function ReportsPage() {
  return (
    <RequireVault>
      <ReportsPageInner />
    </RequireVault>
  )
}
