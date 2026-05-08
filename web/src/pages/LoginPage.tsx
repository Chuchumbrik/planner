import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)

    if (mode === 'login') {
      const { error: err } = await signIn(email.trim(), password)
      setPending(false)
      if (err) {
        setError(err.message)
        return
      }
      navigate('/onboarding', { replace: true })
      return
    }

    const { error: err, session } = await signUp(email.trim(), password)
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }

    if (!session) {
      setInfo(
        'Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите. Если письма нет — проверьте «Спам».',
      )
      setMode('login')
      return
    }

    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Данные задач шифруются на устройстве; на сервер уходит только ciphertext.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          Задайте переменные <code className="rounded bg-black/30 px-1">VITE_SUPABASE_URL</code> и{' '}
          <code className="rounded bg-black/30 px-1">VITE_SUPABASE_ANON_KEY</code> в{' '}
          <code className="rounded bg-black/30 px-1">web/.env.local</code> и на Vercel.
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="block text-sm">
          <span className="text-zinc-400">Email</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none ring-emerald-500/0 transition focus:ring-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Пароль</span>
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

        {info && (
          <p className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
            {info}
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? 'Отправка…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-center text-sm text-emerald-400/90 hover:text-emerald-300"
        onClick={() => {
          setMode((m) => (m === 'login' ? 'register' : 'login'))
          setError(null)
          setInfo(null)
        }}
      >
        {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>

      <Link className="mt-8 text-center text-sm text-zinc-500 hover:text-zinc-300" to="/">
        На главную
      </Link>
    </div>
  )
}
