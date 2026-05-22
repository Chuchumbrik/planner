import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

const PROTOTYPE_LINKS = [
  { to: '/prototype/deep-focus', icon: 'timer', labelKey: 'prototype.nav.deepFocus' },
  { to: '/prototype/ai-insights', icon: 'auto_awesome', labelKey: 'prototype.nav.aiInsights' },
  { to: '/prototype/security-log', icon: 'shield', labelKey: 'prototype.nav.securityLog' },
  { to: '/prototype/admin-dashboard', icon: 'dashboard', labelKey: 'prototype.nav.admin' },
] as const

export function DesignPrototypesSection() {
  const { t } = useTranslation()

  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
        {t('prototype.settingsSectionTitle')}
      </h2>
      <p className="mt-2 text-sm text-on-surface-variant">{t('prototype.settingsSectionHelp')}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {PROTOTYPE_LINKS.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="motivator-card flex items-center gap-3 p-4 transition-colors hover:bg-surface-container-high"
            >
              <MaterialIcon name={item.icon} className="text-primary" size={22} />
              <span className="font-display text-sm text-on-surface">{t(item.labelKey)}</span>
              <MaterialIcon
                name="chevron_right"
                className="ml-auto text-on-surface-variant"
                size={20}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
