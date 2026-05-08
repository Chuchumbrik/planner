import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { generateSeedB64 } from '@/lib/cryptoVault'
import { useVault } from '@/vault/VaultProvider'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { ready, unlocked, saveSeed } = useVault()
  const [password, setPassword] = useState('')
  const [seedPreview, setSeedPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!session) return <Navigate to="/login" replace />

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-400">Загрузка…</p>
      </div>
    )
  }

  if (unlocked) return <Navigate to="/app" replace />

  async function handleGenerate() {
    setError(null)
    setSeedPreview(generateSeedB64())
  }

  async function handleContinue() {
    if (!seedPreview) {
      setError('Сначала сгенерируйте seed.')
      return
    }
    setPending(true)
    try {
      await saveSeed(seedPreview, password)
      navigate('/app', { replace: true })
    } catch {
      setError('Не удалось сохранить ключ. Попробуйте снова.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Ключ шифрования</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Seed используется вместе с паролем деривации (можно оставить пустым в V1 — менее безопасно).
        Экспортируйте seed и храните офлайн. При потере seed данные не восстановить (
        <span className="text-zinc-300">см. журнал решений DR-006</span>).
      </p>

      <div className="mt-6 space-y-4">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-900 py-2.5 text-sm text-white hover:border-zinc-500"
        >
          Сгенерировать seed
        </button>

        {seedPreview && (
          <div className="rounded-lg border border-zinc-700 bg-black/40 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Seed (base64)</p>
            <p className="mt-2 break-all font-mono text-xs text-emerald-300">{seedPreview}</p>
          </div>
        )}

        <label className="block text-sm">
          <span className="text-zinc-400">Пароль для деривации ключа (опционально)</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/80"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Пусто — только для быстрого теста"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={pending || !seedPreview}
        onClick={() => void handleContinue()}
        className="mt-8 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
      >
        {pending ? 'Сохранение…' : 'Продолжить в приложение'}
      </button>
    </div>
  )
}
