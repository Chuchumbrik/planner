import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { RequireVault } from '@/components/RequireVault'
import { useVault } from '@/vault/VaultProvider'

function SettingsPageInner() {
  const { signOut } = useAuth()
  const { lock } = useVault()

  async function handleSignOut() {
    lock()
    await signOut()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <Link className="mb-6 text-sm text-emerald-400 hover:text-emerald-300" to="/app">
        ← К задачам
      </Link>
      <h1 className="text-xl font-semibold text-white">Настройки</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Seed хранится локально в браузере. Для экспорта скопируйте его на шаге онбординга или
        добавьте экран экспорта позже.
      </p>

      <button
        type="button"
        className="mt-8 w-full rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-100 hover:border-zinc-500"
        onClick={() => void handleSignOut()}
      >
        Выйти из аккаунта
      </button>
    </div>
  )
}

export function SettingsPage() {
  return (
    <RequireVault>
      <SettingsPageInner />
    </RequireVault>
  )
}
