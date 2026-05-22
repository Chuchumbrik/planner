import { useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { BrandMark } from '@/components/brand/BrandMark'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { generateSeedB64 } from '@motivator/core'
import { SeedKeyImportForm } from '@/components/SeedKeyImportForm'
import { hasRemoteVault } from '@/lib/hasRemoteVault'
import { useVault } from '@/vault/VaultProvider'

type OnboardingMode = 'loading' | 'restore' | 'setup'

function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-surface-variant px-4 md:px-10">
        <BrandMark size="sm" showSubtitle />
      </header>
      <main className="relative flex flex-1 flex-col items-center px-4 py-10 md:px-10">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-15" aria-hidden />
        <div className="glass-panel relative z-10 w-full max-w-lg rounded-xl p-6 shadow-2xl md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { ready, unlocked, saveSeed } = useVault()
  const [mode, setMode] = useState<OnboardingMode>('loading')
  const [probeError, setProbeError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [seedPreview, setSeedPreview] = useState<string | null>(null)
  const [savedAck, setSavedAck] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!session?.user?.id || !ready || unlocked) return
    let cancelled = false
    setMode('loading')
    setProbeError(null)
    void hasRemoteVault(session.user.id)
      .then((exists) => {
        if (cancelled) return
        setMode(exists ? 'restore' : 'setup')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setProbeError(e instanceof Error ? e.message : String(e))
        setMode('restore')
      })
    return () => {
      cancelled = true
    }
  }, [session?.user?.id, ready, unlocked])

  if (!session) return <Navigate to="/login" replace />

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">{t('shell.loading')}</p>
      </div>
    )
  }

  if (unlocked) return <Navigate to="/app" replace />

  async function finishSetup(seed: string) {
    setPending(true)
    setError(null)
    try {
      await saveSeed(seed, password)
      navigate('/app', { replace: true })
    } catch {
      setError(t('onboarding.errSave'))
    } finally {
      setPending(false)
    }
  }

  if (mode === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">{t('shell.initCrypto')}</p>
      </div>
    )
  }

  if (mode === 'restore') {
    return (
      <OnboardingLayout>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-variant bg-surface-container-high px-3 py-1">
          <MaterialIcon name="lock" filled size={18} className="text-primary" />
          <span className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
            {t('onboarding.restoreBadge')}
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-on-surface">{t('onboarding.restoreTitle')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {t('onboarding.restoreIntro')}
        </p>
        {probeError ? (
          <p className="mt-3 text-xs text-error">{probeError}</p>
        ) : null}
        <div className="mt-6">
          <SeedKeyImportForm
            onSubmit={async (seed, kdf) => {
              await saveSeed(seed, kdf)
              navigate('/app', { replace: true })
            }}
          />
        </div>
        <div className="mt-6 flex gap-2 rounded-lg border border-tertiary-container/30 bg-tertiary-container/5 p-3 text-sm text-on-surface-variant">
          <MaterialIcon name="gpp_maybe" className="shrink-0 text-tertiary" size={20} />
          <p>{t('onboarding.securityNotice')}</p>
        </div>
      </OnboardingLayout>
    )
  }

  const canContinueSetup = Boolean(seedPreview) && savedAck

  return (
    <OnboardingLayout>
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-variant bg-surface-container-high px-3 py-1">
        <MaterialIcon name="key" size={18} className="text-primary" />
        <span className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
          {t('onboarding.setupBadge')}
        </span>
      </div>
      <h1 className="font-display text-2xl font-bold text-on-surface">{t('onboarding.setupTitle')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        <Trans
          i18nKey="onboarding.setupIntro"
          components={{ strong: <strong className="text-on-surface" /> }}
        />
      </p>

      <button
        type="button"
        onClick={() => {
          setError(null)
          setSeedPreview(generateSeedB64())
        }}
        className="btn-secondary mt-6 w-full py-2.5"
      >
        {t('onboarding.generate')}
      </button>

      {seedPreview ? (
        <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
          <p className="font-display text-xs uppercase tracking-wide text-on-surface-variant">
            {t('onboarding.seedLabel')}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-primary">{seedPreview}</p>
          <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
            {t('settings.seedWarningBody')}
          </p>
        </div>
      ) : null}

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-on-surface">
        <input
          type="checkbox"
          className="mt-0.5 rounded border-surface-variant text-primary"
          checked={savedAck}
          disabled={!seedPreview}
          onChange={(e) => setSavedAck(e.target.checked)}
        />
        <span>{t('onboarding.setupSavedAck')}</span>
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-display text-xs uppercase tracking-wide text-on-surface-variant">
          {t('onboarding.kdfPassword')}
        </span>
        <input
          className="motivator-input mt-1.5 w-full px-3 py-2.5 text-sm"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={t('onboarding.kdfPlaceholder')}
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-lg border border-error-container/60 bg-error-container/20 px-3 py-2 text-sm text-error">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending || !canContinueSetup}
        onClick={() => void finishSetup(seedPreview!)}
        className="btn-primary mt-8 w-full py-3 disabled:opacity-40"
      >
        {pending ? t('onboarding.saving') : t('onboarding.continue')}
      </button>
    </OnboardingLayout>
  )
}
