import { useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { generateSeedB64 } from '@motivator/core'
import { SeedKeyImportForm } from '@/components/SeedKeyImportForm'
import { hasRemoteVault } from '@/lib/hasRemoteVault'
import { useVault } from '@/vault/VaultProvider'

type OnboardingMode = 'loading' | 'restore' | 'setup'

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-400">{t('shell.loading')}</p>
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-400">{t('shell.initCrypto')}</p>
      </div>
    )
  }

  if (mode === 'restore') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-semibold text-white">{t('onboarding.restoreTitle')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t('onboarding.restoreIntro')}</p>
        {probeError ? (
          <p className="mt-3 text-xs text-amber-500/90">{probeError}</p>
        ) : null}
        <div className="mt-6">
          <SeedKeyImportForm
            onSubmit={async (seed, kdf) => {
              await saveSeed(seed, kdf)
              navigate('/app', { replace: true })
            }}
          />
        </div>
      </div>
    )
  }

  const canContinueSetup = Boolean(seedPreview) && savedAck

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">{t('onboarding.setupTitle')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        <Trans
          i18nKey="onboarding.setupIntro"
          components={{ strong: <strong className="text-zinc-300" /> }}
        />
      </p>

      <button
        type="button"
        onClick={() => {
          setError(null)
          setSeedPreview(generateSeedB64())
        }}
        className="mt-6 w-full rounded-lg border border-zinc-600 bg-zinc-900 py-2.5 text-sm text-white hover:border-zinc-500"
      >
        {t('onboarding.generate')}
      </button>

      {seedPreview ? (
        <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/25 px-3 py-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{t('onboarding.seedLabel')}</p>
          <p className="mt-2 break-all font-mono text-xs text-emerald-300">{seedPreview}</p>
          <p className="mt-3 text-xs leading-relaxed text-amber-100/90">{t('settings.seedWarningBody')}</p>
        </div>
      ) : null}

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={savedAck}
          disabled={!seedPreview}
          onChange={(e) => setSavedAck(e.target.checked)}
        />
        <span>{t('onboarding.setupSavedAck')}</span>
      </label>

      <label className="mt-4 block text-sm">
        <span className="text-zinc-400">{t('onboarding.kdfPassword')}</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/80"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={t('onboarding.kdfPlaceholder')}
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending || !canContinueSetup}
        onClick={() => void finishSetup(seedPreview!)}
        className="mt-8 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
      >
        {pending ? t('onboarding.saving') : t('onboarding.continue')}
      </button>
    </div>
  )
}
