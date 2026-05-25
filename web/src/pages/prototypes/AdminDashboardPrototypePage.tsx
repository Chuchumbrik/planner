import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { PrototypePageLayout } from '@/pages/prototypes/PrototypePageLayout'
import { useTranslation } from 'react-i18next'

const MOCK_STATS = [
  { icon: 'group', labelKey: 'prototype.admin.statUsers', value: '128' },
  { icon: 'bug_report', labelKey: 'prototype.admin.statDefects', value: '7' },
  { icon: 'cloud_sync', labelKey: 'prototype.admin.statSync', value: '99.2%' },
] as const

export function AdminDashboardPrototypePage() {
  const { t } = useTranslation()

  return (
    <PrototypePageLayout activeNav="prototype-admin" titleKey="prototype.admin.title">
      <p className="mb-6 text-sm text-on-surface-variant">{t('prototype.admin.intro')}</p>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {MOCK_STATS.map((s) => (
          <article key={s.labelKey} className="motivator-card flex items-center gap-4 p-5">
            <MaterialIcon name={s.icon} className="text-primary" size={28} />
            <div>
              <p className="text-xs text-on-surface-variant">{t(s.labelKey)}</p>
              <p className="font-display text-2xl font-bold text-on-surface">{s.value}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="motivator-card p-5">
        <h3 className="font-display text-sm font-semibold text-on-surface">
          {t('prototype.admin.recentTitle')}
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-on-surface-variant">
          <li>{t('prototype.admin.recent1')}</li>
          <li>{t('prototype.admin.recent2')}</li>
          <li>{t('prototype.admin.recent3')}</li>
        </ul>
      </div>
    </PrototypePageLayout>
  )
}
