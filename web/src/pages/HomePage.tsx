import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { BrandMark } from '@/components/brand/BrandMark'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { PAGE_CONTAINER, AUTH_PAGE_HEADER } from '@/lib/designClasses'
import { APP_VERSION } from '@/version'
import { useVault } from '@/vault/VaultProvider'

export function HomePage() {
  const { t } = useTranslation()
  const { session, loading } = useAuth()
  const { ready, unlocked } = useVault()

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">{t('shell.loading')}</p>
      </div>
    )
  }

  if (session && unlocked) return <Navigate to="/app" replace />
  if (session && !unlocked) return <Navigate to="/onboarding" replace />

  const features = [
    { icon: 'encrypted', titleKey: 'home.feature1Title', bodyKey: 'home.feature1Body' },
    { icon: 'calendar_view_month', titleKey: 'home.feature2Title', bodyKey: 'home.feature2Body' },
    { icon: 'insights', titleKey: 'home.feature3Title', bodyKey: 'home.feature3Body' },
  ] as const

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <header className={AUTH_PAGE_HEADER}>
        <BrandMark size="sm" />
        <Link
          className="btn-primary px-5 py-2.5 active:scale-[0.98] transition-transform"
          to="/login"
        >
          {t('home.login')}
        </Link>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-25" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-full max-w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]"
          aria-hidden
        />

        <section className={`relative z-10 pb-20 pt-16 text-center md:pt-24 ${PAGE_CONTAINER}`}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-variant bg-surface-container-high px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
            <span className="text-label-sm text-on-surface-variant">
              {t('home.heroBadge')} · {t('home.badge', { version: APP_VERSION })}
            </span>
          </div>
          <h1 className="mx-auto max-w-3xl text-headline-lg-mobile text-on-surface md:text-headline-xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-md text-on-surface-variant md:text-body-lg">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="btn-primary emerald-glow w-full px-8 py-4 active:scale-[0.98] transition-transform sm:w-auto"
              to="/login"
            >
              {t('home.ctaPrimary')}
            </Link>
            <a
              className="btn-secondary w-full px-8 py-4 active:scale-[0.98] transition-transform sm:w-auto"
              href="https://github.com/Chuchumbrik/planner"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('home.ctaSecondary')}
            </a>
          </div>
        </section>

        <section className={`relative z-10 pb-24 ${PAGE_CONTAINER}`}>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((f) => (
              <article key={f.icon} className="motivator-card p-md transition-colors hover:bg-surface-container-high">
                <MaterialIcon name={f.icon} className="text-primary" size={28} />
                <h2 className="mt-4 text-headline-md text-on-surface">
                  {t(f.titleKey)}
                </h2>
                <p className="mt-2 text-body-sm text-on-surface-variant">{t(f.bodyKey)}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
