import { useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { BrandMark } from '@/components/brand/BrandMark'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  humanizeConnectivityError,
  isLikelyNetworkFetchFailure,
} from '@/lib/connectivityHints'
import { legalDocHref } from '@/lib/legalLinks'
import { isApiConfigured } from '@/lib/apiConfig'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  ALERT_WARNING,
  ALERT_WARNING_BODY,
  AUTH_GLASS_CARD,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

export function LoginPage() {
  const { t } = useTranslation()
  const { signIn, signUp, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [pdConsent, setPdConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)

    if (mode === 'forgot') {
      const { error: err } = await requestPasswordReset(email.trim())
      setPending(false)
      if (err) {
        setError(humanizeConnectivityError(err.message, t))
        setInfo(
          isLikelyNetworkFetchFailure(err.message) ? t('login.networkRegionalHint') : null,
        )
        return
      }
      setInfo(t('login.forgotPasswordSent'))
      setMode('login')
      return
    }

    if (mode === 'login') {
      const { error: err } = await signIn(email.trim(), password)
      setPending(false)
      if (err) {
        setError(humanizeConnectivityError(err.message, t))
        setInfo(
          isLikelyNetworkFetchFailure(err.message) ? t('login.networkRegionalHint') : null,
        )
        return
      }
      navigate('/app', { replace: true })
      return
    }

    if (!pdConsent) {
      setPending(false)
      setError(t('login.registerPdRequired'))
      return
    }

    const { error: err, session } = await signUp(email.trim(), password)
    setPending(false)
    if (err) {
      setError(humanizeConnectivityError(err.message, t))
      setInfo(
        isLikelyNetworkFetchFailure(err.message) ? t('login.networkRegionalHint') : null,
      )
      return
    }

    if (!session) {
      setInfo(t('login.confirmEmailInfo'))
      setMode('login')
      return
    }

    navigate('/app', { replace: true })
  }

  const titleKey =
    mode === 'login'
      ? 'login.loginTitle'
      : mode === 'register'
        ? 'login.registerTitle'
        : 'login.forgotPasswordTitle'

  const backendConfigured = isApiConfigured() || isSupabaseConfigured

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" aria-hidden />
      <div className={cn(AUTH_GLASS_CARD, 'max-w-md p-md md:p-lg')}>
        <div className="mb-6">
          <BrandMark size="sm" showSubtitle />
        </div>
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-outline-variant bg-surface-container-high">
            <MaterialIcon name="lock" className="text-primary" size={22} />
          </div>
          <div>
            <h1 className="text-headline-md font-display font-semibold text-on-surface">{t(titleKey)}</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {mode === 'forgot' ? t('login.forgotPasswordIntro') : t('login.subtitle')}
            </p>
          </div>
        </div>

      {!backendConfigured && (
        <div className={cn(ALERT_WARNING, 'mb-4')}>
          <p className={ALERT_WARNING_BODY}>{t('login.envHintAmveraOrLegacy')}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="block text-sm">
          <span className="font-display text-xs uppercase tracking-wide text-on-surface-variant">
            {t('login.email')}
          </span>
          <input
            className="motivator-input mt-1.5 w-full px-3 py-2.5 text-sm"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {mode !== 'forgot' ? (
          <label className="block text-sm">
            <span className="font-display text-xs uppercase tracking-wide text-on-surface-variant">
              {t('login.password')}
            </span>
            <input
              className="motivator-input mt-1.5 w-full px-3 py-2.5 text-sm"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
        ) : null}

        {mode === 'register' ? (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-on-surface">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={pdConsent}
              onChange={(e) => setPdConsent(e.target.checked)}
            />
            <span>
              <Trans
                i18nKey="login.registerPdConsent"
                components={{
                  link: (
                    <Link
                      className="text-primary hover:brightness-110"
                      to={legalDocHref('personalData')}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            </span>
          </label>
        ) : null}

        {info ? (
          <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            {info}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-primary mt-2 w-full py-3 disabled:opacity-50">
          {pending
            ? t('login.pending')
            : mode === 'login'
              ? t('login.submitLogin')
              : mode === 'register'
                ? t('login.submitRegister')
                : t('login.forgotPasswordSubmit')}
        </button>
      </form>

      {mode === 'login' ? (
        <button
          type="button"
          className="mt-3 w-full text-center text-sm text-on-surface-variant hover:text-on-surface"
          onClick={() => {
            setMode('forgot')
            setError(null)
            setInfo(null)
          }}
        >
          {t('login.forgotPasswordLink')}
        </button>
      ) : null}

      {mode === 'forgot' ? (
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-primary hover:brightness-110"
          onClick={() => {
            setMode('login')
            setError(null)
            setInfo(null)
          }}
        >
          {t('login.forgotPasswordBack')}
        </button>
      ) : (
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-primary hover:brightness-110"
          onClick={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'))
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'login' ? t('login.toggleRegister') : t('login.toggleLogin')}
        </button>
      )}

      <Link
        className="mt-8 block text-center text-sm text-on-surface-variant hover:text-on-surface"
        to="/"
      >
        {t('login.homeLink')}
      </Link>
      </div>
    </div>
  )
}
