import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MonthCalendar } from '@/components/MonthCalendar'
import { WeekGrid } from '@/components/WeekGrid'
import { TaskEditModal } from '@/components/TaskEditModal'
import { TaskMiniCard } from '@/components/TaskMiniCard'
import { RequireVault } from '@/components/RequireVault'
import {
  monthLabel,
  monthWeekMatrix,
  shiftWeekStartMonday,
  startOfWeekMonday,
  weekDayKeys,
} from '@/lib/calendar'
import { localDateKey, parseLocalDateKey, shiftLocalDateKey } from '@/lib/localDate'
import { maxOverlapWithOthers, withTaskPatch } from '@/lib/timeblocking'
import type { PriorityRank, Task } from '@/vault/types'
import { PRIORITY_RANKS } from '@/vault/types'
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

function taskMatchesFilters(
  task: Task,
  filterGroupId: string | 'all',
  priorityEnabled: Set<PriorityRank>,
): boolean {
  if (filterGroupId !== 'all' && task.groupId !== filterGroupId) return false
  if (!priorityEnabled.has(task.priorityRank)) return false
  return true
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

  const [view, setView] = useState<'day' | 'week' | 'month'>('day')
  const [title, setTitle] = useState('')
  const [addToBacklog, setAddToBacklog] = useState(false)
  const [selectedDay, setSelectedDay] = useState(() => localDateKey())
  const [weekStartMonday, setWeekStartMonday] = useState(() =>
    startOfWeekMonday(localDateKey()),
  )
  const _now = new Date()
  const [monthYear, setMonthYear] = useState(() => _now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(() => _now.getMonth())

  const [filterGroupId, setFilterGroupId] = useState<string | 'all'>('all')
  const [priorityEnabled, setPriorityEnabled] = useState(
    () => new Set<PriorityRank>(PRIORITY_RANKS),
  )
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

  const filteredVaultTasks = useMemo(
    () => vault.tasks.filter((x) => taskMatchesFilters(x, filterGroupId, priorityEnabled)),
    [vault.tasks, filterGroupId, priorityEnabled],
  )

  const plannedForDay = useMemo(() => {
    const list = filteredVaultTasks.filter((x) => x.scheduledLocalDate === selectedDay)
    return list.sort(sortByPriorityThenTitle)
  }, [filteredVaultTasks, selectedDay])

  const backlogTasks = useMemo(() => {
    const list = filteredVaultTasks.filter((x) => x.scheduledLocalDate === null)
    return list.sort(sortByPriorityThenTitle)
  }, [filteredVaultTasks])

  const weekDays = useMemo(() => weekDayKeys(weekStartMonday), [weekStartMonday])

  const monthMatrix = useMemo(
    () => monthWeekMatrix(monthYear, monthIndex),
    [monthYear, monthIndex],
  )

  const taskCountByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const task of filteredVaultTasks) {
      const d = task.scheduledLocalDate
      if (!d) continue
      map[d] = (map[d] ?? 0) + 1
    }
    return map
  }, [filteredVaultTasks])

  const editingTask = editId ? vault.tasks.find((x) => x.id === editId) : undefined

  const overlapConfirm = useCallback(
    (patch: Partial<Task>) => {
      if (!editingTask) return true
      const next = withTaskPatch(editingTask, patch)
      const others = vault.tasks.filter((x) => x.id !== editingTask.id && !x.done)
      const max = maxOverlapWithOthers(next, others)
      if (max <= 0) return true
      return window.confirm(t('app.overlapConfirm', { minutes: max }))
    },
    [editingTask, vault.tasks, t],
  )

  function togglePriority(rank: PriorityRank) {
    setPriorityEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(rank)) next.delete(rank)
      else next.add(rank)
      if (next.size === 0) return new Set(PRIORITY_RANKS)
      return next
    })
  }

  function selectAllPriorities() {
    setPriorityEnabled(new Set(PRIORITY_RANKS))
  }

  const informerLine = useMemo(() => {
    const parts: string[] = []
    if (filterGroupId === 'all') {
      parts.push(t('app.informerGroup', { name: t('app.filterAllGroups') }))
    } else {
      const g = vault.groups.find((x) => x.id === filterGroupId)
      parts.push(t('app.informerGroup', { name: g?.name ?? filterGroupId }))
    }
    if (priorityEnabled.size === PRIORITY_RANKS.length) {
      parts.push(t('app.informerPrioritiesAll'))
    } else {
      parts.push(
        t('app.informerPrioritiesSubset', {
          labels: PRIORITY_RANKS.filter((r) => priorityEnabled.has(r))
            .map((r) => vault.priorityLabels[r])
            .join(', '),
        }),
      )
    }
    parts.push(t('app.informerRepeatsNote'))
    return parts.join(' · ')
  }, [
    filterGroupId,
    vault.groups,
    vault.priorityLabels,
    priorityEnabled,
    t,
  ])

  function handleTab(next: 'day' | 'week' | 'month') {
    setView(next)
    if (next === 'week') setWeekStartMonday(startOfWeekMonday(selectedDay))
    if (next === 'month') {
      const d = parseLocalDateKey(selectedDay)
      if (d) {
        setMonthYear(d.getFullYear())
        setMonthIndex(d.getMonth())
      }
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            {t('app.brand')}
          </p>
          <h1 className="text-xl font-semibold text-white">{t('app.plannerTitle')}</h1>
        </div>
        <Link
          to="/settings"
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
        >
          {t('app.settings')}
        </Link>
      </header>

      <nav className="mb-4 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {(['day', 'week', 'month'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              view === v
                ? 'bg-emerald-600 text-emerald-950'
                : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-900'
            }`}
            onClick={() => handleTab(v)}
          >
            {v === 'day' ? t('app.viewDay') : v === 'week' ? t('app.viewWeek') : t('app.viewMonth')}
          </button>
        ))}
      </nav>

      <p className="mb-4 text-xs text-zinc-500" aria-live="polite">
        {syncHint}
      </p>

      {remoteError && (
        <div className="mb-4 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          {t('app.syncErrorPrefix')} {remoteError}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
        <p className="mb-2 text-xs font-medium text-zinc-400">{t('app.filtersTitle')}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-zinc-500">
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

          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">{t('app.filterPriorities')}</span>
            <div className="flex flex-wrap gap-1">
              {PRIORITY_RANKS.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!canEdit}
                  className={`rounded border px-2 py-1 text-xs disabled:opacity-40 ${
                    priorityEnabled.has(r)
                      ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
                      : 'border-zinc-700 text-zinc-500 line-through'
                  }`}
                  onClick={() => togglePriority(r)}
                >
                  {vault.priorityLabels[r]}
                </button>
              ))}
              <button
                type="button"
                disabled={!canEdit}
                className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
                onClick={() => selectAllPriorities()}
              >
                {t('app.filterPrioritiesAllShort')}
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.filterRepeats')}</span>
            <select className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-500" disabled>
              <option>{t('app.filterRepeatsPlaceholder')}</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">{informerLine}</p>
      </div>

      {view === 'day' && (
        <>
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
              <ul className="flex max-w-lg flex-col gap-3">
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
              <ul className="flex max-w-lg flex-col gap-3">
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
        </>
      )}

      {view === 'week' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
              onClick={() => setWeekStartMonday((w) => shiftWeekStartMonday(w, -1))}
            >
              {t('app.weekPrev')}
            </button>
            <span className="flex-1 text-center text-sm text-zinc-300">
              {weekDays[0]} — {weekDays[6]}
            </span>
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
              onClick={() => setWeekStartMonday((w) => shiftWeekStartMonday(w, 1))}
            >
              {t('app.weekNext')}
            </button>
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg border border-emerald-800/60 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40"
              onClick={() => setWeekStartMonday(startOfWeekMonday(localDateKey()))}
            >
              {t('app.weekThis')}
            </button>
          </div>
          <WeekGrid
            weekDays={weekDays}
            tasks={filteredVaultTasks}
            priorityLabels={vault.priorityLabels}
            locale={locale}
            canEdit={canEdit}
            onTaskClick={(id) => setEditId(id)}
          />
        </section>
      )}

      {view === 'month' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
              onClick={() => {
                const d = new Date(monthYear, monthIndex - 1, 1)
                setMonthYear(d.getFullYear())
                setMonthIndex(d.getMonth())
              }}
            >
              {t('app.monthPrev')}
            </button>
            <span className="flex-1 text-center text-sm font-medium text-zinc-200">
              {monthLabel(monthYear, monthIndex, locale)}
            </span>
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
              onClick={() => {
                const d = new Date(monthYear, monthIndex + 1, 1)
                setMonthYear(d.getFullYear())
                setMonthIndex(d.getMonth())
              }}
            >
              {t('app.monthNext')}
            </button>
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg border border-emerald-800/60 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40"
              onClick={() => {
                const now = parseLocalDateKey(localDateKey())!
                setMonthYear(now.getFullYear())
                setMonthIndex(now.getMonth())
              }}
            >
              {t('app.monthThis')}
            </button>
          </div>
          <div className="max-w-md">
            <MonthCalendar
              matrix={monthMatrix}
              taskCountByDay={taskCountByDay}
              locale={locale}
              canEdit={canEdit}
              onPickDay={(dateKey) => {
                setSelectedDay(dateKey)
                setView('day')
              }}
            />
          </div>
        </section>
      )}

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
          onSetScheduledLocalDate={(date) => {
            if (
              !overlapConfirm({
                scheduledLocalDate: date,
              })
            )
              return
            void setTaskScheduledLocalDate(editingTask.id, date)
          }}
          onSetEstimatedMinutes={(m) => {
            if (!overlapConfirm({ estimatedMinutes: m })) return
            void setTaskEstimatedMinutes(editingTask.id, m)
          }}
          onSetTimePlan={(mode, minutes) => {
            if (
              !overlapConfirm({
                timeMode: mode,
                timeMinutesFromMidnight: minutes,
              })
            )
              return
            void setTaskTimePlan(editingTask.id, mode, minutes)
          }}
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
