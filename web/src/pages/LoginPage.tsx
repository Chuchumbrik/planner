import { useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import {
  humanizeConnectivityError,
  isLikelyNetworkFetchFailure,
} from '@/lib/connectivityHints'
import { legalDocHref } from '@/lib/legalLinks'
import { isSupabaseConfigured } from '@/lib/supabase'

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

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">{t(titleKey)}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === 'forgot' ? t('login.forgotPasswordIntro') : t('login.subtitle')}
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          {t('login.envHint', {
            url: t('login.envUrl'),
            key: t('login.envKey'),
            env: t('login.envFile'),
          })}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="block text-sm">
          <span className="text-zinc-400">{t('login.email')}</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none ring-emerald-500/0 transition focus:ring-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {mode !== 'forgot' ? (
          <label className="block text-sm">
            <span className="text-zinc-400">{t('login.password')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none ring-emerald-500/0 transition focus:ring-2"
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
          <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
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
                      className="text-emerald-400 hover:text-emerald-300"
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
          <p className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
            {info}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
        >
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
          className="mt-3 text-center text-sm text-zinc-400 hover:text-zinc-200"
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
          className="mt-4 text-center text-sm text-emerald-400/90 hover:text-emerald-300"
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
          className="mt-4 text-center text-sm text-emerald-400/90 hover:text-emerald-300"
          onClick={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'))
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'login' ? t('login.toggleRegister') : t('login.toggleLogin')}
        </button>
      )}

      <Link className="mt-8 text-center text-sm text-zinc-500 hover:text-zinc-300" to="/">
        {t('login.homeLink')}
      </Link>
    </div>
  )
}
