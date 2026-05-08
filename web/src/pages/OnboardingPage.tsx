import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { generateSeedB64 } from '@/lib/cryptoVault'
import { useVault } from '@/vault/VaultProvider'

type SeedMode = 'generate' | 'import'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { ready, unlocked, saveSeed } = useVault()
  const [mode, setMode] = useState<SeedMode>('generate')
  const [password, setPassword] = useState('')
  const [seedPreview, setSeedPreview] = useState<string | null>(null)
  const [importedSeed, setImportedSeed] = useState('')
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

  function effectiveSeed(): string | null {
    if (mode === 'import') {
      const s = importedSeed.trim().replace(/\s+/g, '')
      return s.length > 0 ? s : null
    }
    return seedPreview
  }

  function handleGenerate() {
    setError(null)
    setSeedPreview(generateSeedB64())
  }

  async function handleContinue() {
    const seed = effectiveSeed()
    if (!seed) {
      setError(
        mode === 'import'
          ? 'Вставьте сохранённый seed (base64) одной строкой.'
          : 'Сначала сгенерируйте seed.',
      )
      return
    }
    setPending(true)
    try {
      await saveSeed(seed, password)
      navigate('/app', { replace: true })
    } catch {
      setError('Не удалось сохранить ключ. Попробуйте снова.')
    } finally {
      setPending(false)
    }
  }

  const canContinue = Boolean(effectiveSeed())

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Ключ шифрования</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Seed используется вместе с паролем деривации (можно оставить пустым в V1 — менее безопасно).
        После выхода из аккаунта seed стирается из браузера — чтобы снова открыть те же задачи, вставьте{' '}
        <strong className="text-zinc-300">тот же</strong> seed и тот же пароль деривации, что при первом входе.
      </p>

      <div className="mt-6 flex gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            mode === 'generate'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          onClick={() => {
            setMode('generate')
            setError(null)
          }}
        >
          Новый seed
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            mode === 'import'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          onClick={() => {
            setMode('import')
            setError(null)
          }}
        >
          У меня уже есть seed
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {mode === 'generate' ? (
          <>
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
          </>
        ) : (
          <label className="block text-sm">
            <span className="text-zinc-400">Вставьте сохранённый seed (base64)</span>
            <textarea
              className="mt-1 min-h-[88px] w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500/80"
              value={importedSeed}
              onChange={(e) => setImportedSeed(e.target.value)}
              placeholder="Одна строка без пробелов в середине"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="text-zinc-400">Пароль для деривации ключа (как при первом входе)</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/80"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Если оставляли пустым — снова пусто"
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
        disabled={pending || !canContinue}
        onClick={() => void handleContinue()}
        className="mt-8 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
      >
        {pending ? 'Сохранение…' : 'Продолжить в приложение'}
      </button>
    </div>
  )
}
