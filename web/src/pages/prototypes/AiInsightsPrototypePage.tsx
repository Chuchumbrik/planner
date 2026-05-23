import { PrototypePageLayout } from '@/pages/prototypes/PrototypePageLayout'
import { useTranslation } from 'react-i18next'

const MOCK_INSIGHTS = [
  { key: 'prototype.aiInsights.item1', pct: 84 },
  { key: 'prototype.aiInsights.item2', pct: 62 },
  { key: 'prototype.aiInsights.item3', pct: 41 },
] as const

export function AiInsightsPrototypePage() {
  const { t } = useTranslation()

  return (
    <PrototypePageLayout activeNav="prototype-ai-insights" titleKey="prototype.aiInsights.title">
      <p className="mb-6 text-sm text-on-surface-variant">{t('prototype.aiInsights.intro')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_INSIGHTS.map((row) => (
          <article key={row.key} className="motivator-card p-6">
            <p className="font-display text-sm font-semibold text-on-surface">{t(row.key)}</p>
            <div className="mt-4 h-1.5 w-full bg-surface-variant">
              <div className="h-full bg-primary" style={{ width: `${row.pct}%` }} />
            </div>
            <p className="mt-2 font-mono text-sm text-primary">{row.pct}%</p>
          </article>
        ))}
        <article className="motivator-card flex min-h-[180px] flex-col justify-center p-6 md:col-span-2">
          <p className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
            {t('prototype.aiInsights.chartTitle')}
          </p>
          <div className="mt-4 flex h-32 items-end justify-center gap-2">
            {[40, 65, 55, 80, 70, 90, 60].map((h, i) => (
              <div
                key={i}
                className="w-8 bg-primary/80"
                style={{ height: `${h}%` }}
                aria-hidden
              />
            ))}
          </div>
        </article>
      </div>
    </PrototypePageLayout>
  )
}
