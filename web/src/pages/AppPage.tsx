import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CreateTaskModal } from '@/components/CreateTaskModal'
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
import { taskOccursOnDate } from '@/lib/recurrence'
import { maxOverlapWithOthers, withTaskPatch } from '@/lib/timeblocking'
import type { PriorityRank, Task, TaskDraft } from '@/vault/types'
import { DEFAULT_GROUP_ID, PRIORITY_RANKS } from '@/vault/types'
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

function passesRepeatFilter(
  task: Task,
  mode: 'all' | 'recurring' | 'nonRecurring',
): boolean {
  if (mode === 'all') return true
  const has = Boolean(task.recurrence)
  return mode === 'recurring' ? has : !has
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
    createTask,
    upsertDraft,
    deleteDraft,
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
  const [createOpen, setCreateOpen] = useState(false)
  const [resumeDraft, setResumeDraft] = useState<TaskDraft | null>(null)
  const [selectedDay, setSelectedDay] = useState(() => localDateKey())
  const [weekStartMonday, setWeekStartMonday] = useState(() =>
    startOfWeekMonday(localDateKey()),
  )
  const _now = new Date()
  const [monthYear, setMonthYear] = useState(() => _now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(() => _now.getMonth())

  const [filterGroupId, setFilterGroupId] = useState<string | 'all'>('all')
  const [filterRepeats, setFilterRepeats] = useState<'all' | 'recurring' | 'nonRecurring'>(
    'all',
  )
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
    () =>
      vault.tasks.filter(
        (x) =>
          taskMatchesFilters(x, filterGroupId, priorityEnabled) &&
          passesRepeatFilter(x, filterRepeats),
      ),
    [vault.tasks, filterGroupId, priorityEnabled, filterRepeats],
  )

  const plannedForDay = useMemo(() => {
    const list = filteredVaultTasks.filter((x) => {
      if (x.scheduledLocalDate === null && !x.recurrence) return false
      return taskOccursOnDate(x, selectedDay)
    })
    return list.sort(sortByPriorityThenTitle)
  }, [filteredVaultTasks, selectedDay])

  const backlogTasks = useMemo(() => {
    const list = filteredVaultTasks.filter(
      (x) => x.scheduledLocalDate === null && !x.recurrence,
    )
    return list.sort(sortByPriorityThenTitle)
  }, [filteredVaultTasks])

  const weekDays = useMemo(() => weekDayKeys(weekStartMonday), [weekStartMonday])

  const monthMatrix = useMemo(
    () => monthWeekMatrix(monthYear, monthIndex),
    [monthYear, monthIndex],
  )

  const taskCountByDay = useMemo(() => {
    const map: Record<string, number> = {}
    const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      let c = 0
      for (const task of filteredVaultTasks) {
        if (taskOccursOnDate(task, key)) c++
      }
      map[key] = c
    }
    return map
  }, [filteredVaultTasks, monthYear, monthIndex])

  const editingTask = editId ? vault.tasks.find((x) => x.id === editId) : undefined

  const overlapConfirm = useCallback(
    (patch: Partial<Task>) => {
      if (!editingTask) return true
      const next = withTaskPatch(editingTask, patch)
      const others = vault.tasks.filter((x) => x.id !== editingTask.id && !x.done)
      const overlapDay = taskOccursOnDate(next, selectedDay)
        ? selectedDay
        : next.scheduledLocalDate ?? next.recurrenceAnchorLocalDate ?? selectedDay
      const max = maxOverlapWithOthers(next, others, overlapDay)
      if (max <= 0) return true
      return window.confirm(t('app.overlapConfirm', { minutes: max }))
    },
    [editingTask, vault.tasks, selectedDay, t],
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
    if (filterRepeats === 'all') {
      parts.push(t('app.informerRepeatsAll'))
    } else if (filterRepeats === 'recurring') {
      parts.push(t('app.informerRepeatsOnly'))
    } else {
      parts.push(t('app.informerRepeatsWithout'))
    }
    return parts.join(' · ')
  }, [
    filterGroupId,
    filterRepeats,
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
            <select
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
              value={filterRepeats}
              disabled={!canEdit}
              onChange={(e) =>
                setFilterRepeats(e.target.value as 'all' | 'recurring' | 'nonRecurring')
              }
            >
              <option value="all">{t('app.filterRepeatsAll')}</option>
              <option value="recurring">{t('app.filterRepeatsRecurring')}</option>
              <option value="nonRecurring">{t('app.filterRepeatsNonRecurring')}</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">{informerLine}</p>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={!canEdit}
          className="w-full max-w-lg rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-emerald-950 hover:bg-emerald-500 disabled:opacity-40"
          onClick={() => {
            setResumeDraft(null)
            setCreateOpen(true)
          }}
        >
          {t('app.openCreateTask')}
        </button>

        {vault.drafts.length > 0 ? (
          <section className="max-w-lg rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
              {t('app.draftsTitle')}
            </h3>
            <ul className="flex flex-col gap-2">
              {vault.drafts.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-zinc-200">
                    {d.title.trim() ? d.title : t('app.draftUntitled')}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={!canEdit}
                      className="rounded border border-emerald-800 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950/50 disabled:opacity-40"
                      onClick={() => {
                        setResumeDraft(d)
                        setCreateOpen(true)
                      }}
                    >
                      {t('app.draftContinue')}
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 disabled:opacity-40"
                      onClick={() => void deleteDraft(d.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <CreateTaskModal
        open={createOpen}
        selectedDayKey={selectedDay}
        resumeDraft={resumeDraft}
        groups={vault.groups}
        priorityLabels={vault.priorityLabels}
        defaultGroupId={filterGroupId !== 'all' ? filterGroupId : DEFAULT_GROUP_ID}
        canEdit={canEdit}
        onClose={() => {
          setCreateOpen(false)
          setResumeDraft(null)
        }}
        onSave={async (input, opts) => {
          await createTask(input)
          if (opts.removeDraftId) await deleteDraft(opts.removeDraftId)
        }}
        onPersistDraft={(d) => upsertDraft(d)}
      />

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
          onApplyTaskPatch={(patch) => void patchTask(editingTask.id, patch)}
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
