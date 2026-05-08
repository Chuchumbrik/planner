import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TaskCard } from '@/components/TaskCard'
import { RequireVault } from '@/components/RequireVault'
import { useVault } from '@/vault/VaultProvider'

function formatSynced(ts: number | null, locale: string): string | null {
  if (ts == null) return null
  try {
    return new Date(ts).toLocaleString(locale, {
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
  const { t, i18n } = useTranslation()
  const {
    vault,
    remoteError,
    remoteHydrated,
    decryptFailed,
    savePending,
    lastSyncedAt,
    addTask,
    toggleTask,
    removeTask,
    setTaskColor,
    setTaskGroup,
    addSubtask,
    toggleSubtask,
    removeSubtask,
  } = useVault()
  const [title, setTitle] = useState('')
  const [filterGroupId, setFilterGroupId] = useState<string | 'all'>('all')

  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const syncHint = !remoteHydrated
    ? t('app.syncLoadingVault')
    : savePending
      ? t('app.syncSaving')
      : lastSyncedAt
        ? t('app.syncDone', { time: formatSynced(lastSyncedAt, locale) ?? '' })
        : t('app.syncReady')

  const canEdit = remoteHydrated && !decryptFailed

  const sortedGroups = useMemo(
    () => [...vault.groups].sort((a, b) => a.sortOrder - b.sortOrder),
    [vault.groups],
  )

  const filteredTasks = useMemo(() => {
    if (filterGroupId === 'all') return vault.tasks
    return vault.tasks.filter((x) => x.groupId === filterGroupId)
  }, [vault.tasks, filterGroupId])

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            {t('app.brand')}
          </p>
          <h1 className="text-xl font-semibold text-white">{t('app.tasks')}</h1>
        </div>
        <Link
          to="/settings"
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
        >
          {t('app.settings')}
        </Link>
      </header>

      <p className="mb-4 text-xs text-zinc-500" aria-live="polite">
        {syncHint}
      </p>

      {remoteError && (
        <div className="mb-4 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          {t('app.syncErrorPrefix')} {remoteError}
        </div>
      )}

      <div className="mb-4">
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.group')}</span>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            value={filterGroupId}
            disabled={!canEdit}
            onChange={(e) =>
              setFilterGroupId(e.target.value === 'all' ? 'all' : e.target.value)
            }
          >
            <option value="all">{t('app.filterAllGroups')}</option>
            {sortedGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canEdit) return
          void addTask(title, {
            groupId: filterGroupId !== 'all' ? filterGroupId : undefined,
          }).then(() => setTitle(''))
        }}
      >
        <input
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/80 disabled:opacity-50"
          placeholder={remoteHydrated ? t('app.newTask') : t('app.waitLoad')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />
        <button
          type="submit"
          disabled={!canEdit}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
        >
          {t('common.add')}
        </button>
      </form>

      <ul className="flex flex-col gap-3">
        {filteredTasks.length === 0 && (
          <li className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
            {t('app.emptyList')}
          </li>
        )}
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            groups={vault.groups}
            canEdit={canEdit}
            onToggle={() => void toggleTask(task.id)}
            onRemove={() => void removeTask(task.id)}
            onSetColor={(key) => void setTaskColor(task.id, key)}
            onSetGroup={(gid) => void setTaskGroup(task.id, gid)}
            onAddSubtask={(subTitle) => void addSubtask(task.id, subTitle)}
            onToggleSubtask={(subId) => void toggleSubtask(task.id, subId)}
            onRemoveSubtask={(subId) => void removeSubtask(task.id, subId)}
          />
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
