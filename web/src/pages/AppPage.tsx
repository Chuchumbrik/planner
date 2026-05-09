import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TaskCard } from '@/components/TaskCard'
import { RequireVault } from '@/components/RequireVault'
import {
  EISENHOWER_QUADRANTS,
  type EisenhowerQuadrant,
  type PriorityLevel,
  type Task,
} from '@/vault/types'
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

const LEVEL_SECTION: Record<PriorityLevel, 'app.sectionPriority1' | 'app.sectionPriority2' | 'app.sectionPriority3'> =
  {
    1: 'app.sectionPriority1',
    2: 'app.sectionPriority2',
    3: 'app.sectionPriority3',
  }

const QUADRANT_TITLE: Record<
  EisenhowerQuadrant,
  'app.eisenhowerQ1' | 'app.eisenhowerQ2' | 'app.eisenhowerQ3' | 'app.eisenhowerQ4'
> = {
  q1: 'app.eisenhowerQ1',
  q2: 'app.eisenhowerQ2',
  q3: 'app.eisenhowerQ3',
  q4: 'app.eisenhowerQ4',
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
    setTaskPriorityLevel,
    setTaskEisenhowerQuadrant,
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

  const groupFiltered = useMemo(() => {
    if (filterGroupId === 'all') return vault.tasks
    return vault.tasks.filter((x) => x.groupId === filterGroupId)
  }, [vault.tasks, filterGroupId])

  const layoutWide = vault.prioritySystem === 'eisenhower'

  const renderCards = (tasks: Task[]) =>
    tasks.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        groups={vault.groups}
        prioritySystem={vault.prioritySystem}
        canEdit={canEdit}
        onToggle={() => void toggleTask(task.id)}
        onRemove={() => void removeTask(task.id)}
        onSetColor={(key) => void setTaskColor(task.id, key)}
        onSetGroup={(gid) => void setTaskGroup(task.id, gid)}
        onSetPriorityLevel={(level) => void setTaskPriorityLevel(task.id, level)}
        onSetEisenhowerQuadrant={(q) => void setTaskEisenhowerQuadrant(task.id, q)}
        onAddSubtask={(subTitle) => void addSubtask(task.id, subTitle)}
        onToggleSubtask={(subId) => void toggleSubtask(task.id, subId)}
        onRemoveSubtask={(subId) => void removeSubtask(task.id, subId)}
      />
    ))

  const levelsBody =
    groupFiltered.length === 0 ? (
      <li className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
        {t('app.emptyList')}
      </li>
    ) : (
      ([1, 2, 3] as const).map((level) => {
        const bucket = groupFiltered.filter((x) => x.priorityLevel === level)
        return (
          <li key={level} className="mt-6 list-none first:mt-0">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t(LEVEL_SECTION[level])}
            </h2>
            {bucket.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-800/80 px-3 py-4 text-center text-xs text-zinc-600">
                {t('app.emptyQuadrant')}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">{renderCards(bucket)}</ul>
            )}
          </li>
        )
      })
    )

  const inboxTasks = groupFiltered.filter((x) => x.eisenhowerQuadrant === null)

  const eisenhowerBody =
    groupFiltered.length === 0 ? (
      <li className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
        {t('app.emptyList')}
      </li>
    ) : (
      <>
        <li className="list-none">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-500/90">
            {t('app.inbox')}
          </h2>
          {inboxTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800/80 px-3 py-4 text-center text-xs text-zinc-600">
              {t('app.emptyQuadrant')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">{renderCards(inboxTasks)}</ul>
          )}
        </li>
        <li className="list-none mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EISENHOWER_QUADRANTS.map((q) => {
              const bucket = groupFiltered.filter((x) => x.eisenhowerQuadrant === q)
              return (
                <section
                  key={q}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
                >
                  <h3 className="text-xs font-semibold text-zinc-400">
                    {t(QUADRANT_TITLE[q])}
                  </h3>
                  {bucket.length === 0 ? (
                    <p className="mt-3 text-center text-xs text-zinc-600">{t('app.emptyQuadrant')}</p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-3">{renderCards(bucket)}</ul>
                  )}
                </section>
              )
            })}
          </div>
        </li>
      </>
    )

  return (
    <div
      className={`mx-auto flex min-h-screen flex-col px-4 py-8 ${layoutWide ? 'max-w-2xl' : 'max-w-lg'}`}
    >
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

      <ul className="flex flex-col">
        {vault.prioritySystem === 'levels' ? levelsBody : eisenhowerBody}
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
