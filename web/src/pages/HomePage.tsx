import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { APP_VERSION } from '@/version'
import { useVault } from '@/vault/VaultProvider'

export function HomePage() {
  const { t } = useTranslation()
  const { session, loading } = useAuth()
  const { ready, unlocked } = useVault()

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-400">{t('shell.loading')}</p>
      </div>
    )
  }

  if (session && unlocked) return <Navigate to="/app" replace />
  if (session && !unlocked) return <Navigate to="/onboarding" replace />

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
          {t('home.badge', { version: APP_VERSION })}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{t('home.title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t('home.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400"
          to="/login"
        >
          {t('home.login')}
        </Link>
        <span className="inline-flex items-center justify-center rounded-lg border border-zinc-800 px-4 py-2.5 text-sm text-zinc-500">
          {t('home.docsHint')}
        </span>
      </div>
    </div>
  )
}
