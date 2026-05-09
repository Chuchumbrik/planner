import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TaskEditModal } from '@/components/TaskEditModal'
import { TaskMiniCard } from '@/components/TaskMiniCard'
import { RequireVault } from '@/components/RequireVault'
import { localDateKey, shiftLocalDateKey } from '@/lib/localDate'
import type { Task } from '@/vault/types'
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

function formatDayHeading(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  try {
    return dt.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}

function sortByPriorityThenTitle(a: Task, b: Task): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
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
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    setTaskPriorityRank,
    setTaskScheduledLocalDate,
    setTaskEstimatedMinutes,
    setTaskTimePlan,
    patchTask,
  } = useVault()

  const [title, setTitle] = useState('')
  const [addToBacklog, setAddToBacklog] = useState(false)
  const [selectedDay, setSelectedDay] = useState(() => localDateKey())
  const [filterGroupId, setFilterGroupId] = useState<string | 'all'>('all')
  const [editId, setEditId] = useState<string | null>(null)

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

  const plannedForDay = useMemo(() => {
    const list = vault.tasks.filter((x) => x.scheduledLocalDate === selectedDay)
    const filtered =
      filterGroupId === 'all' ? list : list.filter((x) => x.groupId === filterGroupId)
    return filtered.sort(sortByPriorityThenTitle)
  }, [vault.tasks, selectedDay, filterGroupId])

  const backlogTasks = useMemo(() => {
    const list = vault.tasks.filter((x) => x.scheduledLocalDate === null)
    const filtered =
      filterGroupId === 'all' ? list : list.filter((x) => x.groupId === filterGroupId)
    return filtered.sort(sortByPriorityThenTitle)
  }, [vault.tasks, filterGroupId])

  const editingTask = editId ? vault.tasks.find((x) => x.id === editId) : undefined

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            {t('app.brand')}
          </p>
          <h1 className="text-xl font-semibold text-white">{t('app.dayTitle')}</h1>
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
          onClick={() => setSelectedDay(shiftLocalDateKey(selectedDay, -1))}
        >
          ←
        </button>
        <span className="min-w-0 flex-1 text-center text-sm font-medium text-zinc-200">
          {formatDayHeading(selectedDay, locale)}
        </span>
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
          onClick={() => setSelectedDay(shiftLocalDateKey(selectedDay, 1))}
        >
          →
        </button>
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-emerald-800/60 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40"
          onClick={() => setSelectedDay(localDateKey())}
        >
          {t('app.today')}
        </button>
      </div>

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
        className="mb-6 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canEdit) return
          void addTask(title, {
            groupId: filterGroupId !== 'all' ? filterGroupId : undefined,
            scheduledLocalDate: addToBacklog ? null : selectedDay,
          }).then(() => {
            setTitle('')
            setAddToBacklog(false)
          })
        }}
      >
        <div className="flex gap-2">
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
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={addToBacklog}
            disabled={!canEdit}
            onChange={(e) => setAddToBacklog(e.target.checked)}
          />
          {t('app.addToBacklog')}
        </label>
      </form>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t('app.sectionPlanned')}
        </h2>
        {plannedForDay.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
            {t('app.emptyPlannedDay')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {plannedForDay.map((task) => (
              <li key={task.id} className="list-none">
                <TaskMiniCard
                  task={task}
                  priorityLabels={vault.priorityLabels}
                  canEdit={canEdit}
                  onToggle={() => void toggleTask(task.id)}
                  onOpen={() => setEditId(task.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-500/90">
          {t('app.sectionBacklog')}
        </h2>
        {backlogTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
            {t('app.emptyBacklog')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {backlogTasks.map((task) => (
              <li key={task.id} className="list-none">
                <TaskMiniCard
                  task={task}
                  priorityLabels={vault.priorityLabels}
                  canEdit={canEdit}
                  onToggle={() => void toggleTask(task.id)}
                  onOpen={() => setEditId(task.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingTask ? (
        <TaskEditModal
          key={editingTask.id}
          task={editingTask}
          groups={vault.groups}
          priorityLabels={vault.priorityLabels}
          selectedDayKey={selectedDay}
          canEdit={canEdit}
          onClose={() => setEditId(null)}
          onRemove={() => void removeTask(editingTask.id)}
          onSetColor={(key) => void setTaskColor(editingTask.id, key)}
          onSetGroup={(gid) => void setTaskGroup(editingTask.id, gid)}
          onSetPriorityRank={(rank) => void setTaskPriorityRank(editingTask.id, rank)}
          onSetScheduledLocalDate={(date) =>
            void setTaskScheduledLocalDate(editingTask.id, date)
          }
          onSetEstimatedMinutes={(m) =>
            void setTaskEstimatedMinutes(editingTask.id, m)
          }
          onSetTimePlan={(mode, minutes) =>
            void setTaskTimePlan(editingTask.id, mode, minutes)
          }
          onTitleCommit={(ti) => void patchTask(editingTask.id, { title: ti })}
          onAddChecklistItem={(newTitle) =>
            void addChecklistItem(editingTask.id, newTitle)
          }
          onToggleChecklistItem={(itemId) =>
            void toggleChecklistItem(editingTask.id, itemId)
          }
          onRemoveChecklistItem={(itemId) =>
            void removeChecklistItem(editingTask.id, itemId)
          }
        />
      ) : null}
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
