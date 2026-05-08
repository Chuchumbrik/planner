import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RequireVault } from '@/components/RequireVault'
import { useVault } from '@/vault/VaultProvider'

function formatSynced(ts: number | null): string | null {
  if (ts == null) return null
  try {
    return new Date(ts).toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return null
  }
}

function AppPageInner() {
  const {
    vault,
    remoteError,
    remoteHydrated,
    savePending,
    lastSyncedAt,
    addTask,
    toggleTask,
    removeTask,
  } = useVault()
  const [title, setTitle] = useState('')

  const syncHint = !remoteHydrated
    ? 'Загрузка vault с сервера…'
    : savePending
      ? 'Сохранение…'
      : lastSyncedAt
        ? `Синхронизировано ${formatSynced(lastSyncedAt) ?? ''}`.trim()
        : 'Готово к работе'

  const canEdit = remoteHydrated && !remoteError?.includes('расшифровать')

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            Мотиватор
          </p>
          <h1 className="text-xl font-semibold text-white">Задачи</h1>
        </div>
        <Link
          to="/settings"
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
        >
          Настройки
        </Link>
      </header>

      <p className="mb-4 text-xs text-zinc-500" aria-live="polite">
        {syncHint}
      </p>

      {remoteError && (
        <div className="mb-4 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Синхронизация: {remoteError}
        </div>
      )}

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canEdit) return
          void addTask(title).then(() => setTitle(''))
        }}
      >
        <input
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/80 disabled:opacity-50"
          placeholder={remoteHydrated ? 'Новая задача' : 'Подождите загрузку…'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />
        <button
          type="submit"
          disabled={!canEdit}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
        >
          Добавить
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {vault.tasks.length === 0 && (
          <li className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
            Пока пусто. Добавьте первую задачу — она сохранится в зашифрованном vault в Supabase.
          </li>
        )}
        {vault.tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5"
          >
            <label className="flex flex-1 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={t.done}
                disabled={!canEdit}
                onChange={() => void toggleTask(t.id)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
              />
              <span
                className={`text-sm ${t.done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}
              >
                {t.title}
              </span>
            </label>
            <button
              type="button"
              disabled={!canEdit}
              className="text-xs text-red-400/90 hover:text-red-300 disabled:opacity-40"
              onClick={() => void removeTask(t.id)}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AppPage() {
  return (
    <RequireVault>
      <AppPageInner />
    </RequireVault>
  )
}
