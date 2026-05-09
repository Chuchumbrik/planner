import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { EndOfDayModal } from '@/components/EndOfDayModal'
import { MonthCalendar } from '@/components/MonthCalendar'
import { WeekGrid } from '@/components/WeekGrid'
import { TaskEditModal } from '@/components/TaskEditModal'
import { TaskMiniCard } from '@/components/TaskMiniCard'
import { RequireVault } from '@/components/RequireVault'
import {
  DEFAULT_GROUP_ID,
  PRIORITY_RANKS,
  localDateKey,
  maxOverlapWithOthers,
  monthLabel,
  monthWeekMatrix,
  parseLocalDateKey,
  shiftLocalDateKey,
  shiftWeekStartMonday,
  startOfWeekMonday,
  isMainTaskDoneForDay,
  taskHasOccurrenceOnDate,
  taskOccursOnDate,
  weekDayKeys,
  withTaskPatch,
  type PriorityRank,
  type Task,
  type TaskColorKey,
  type TaskDraft,
} from '@motivator/core'
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

/** Невыполненные выше, затем по приоритету и названию. */
function sortDayPlan(a: Task, b: Task, dayKey: string): number {
  const aDone = isMainTaskDoneForDay(a, dayKey)
  const bDone = isMainTaskDoneForDay(b, dayKey)
  if (aDone !== bDone) return aDone ? 1 : -1
  return sortByPriorityThenTitle(a, b)
}

/** Бэклог: невыполненные сверху. */
function sortBacklogTasks(a: Task, b: Task): number {
  if (a.done !== b.done) return a.done ? 1 : -1
  return sortByPriorityThenTitle(a, b)
}

function taskMatchesFilters(
  task: Task,
  filterGroupId: string | 'all',
  priorityEnabled: Set<PriorityRank>,
  filterColor: TaskColorKey | 'all',
): boolean {
  if (filterGroupId !== 'all' && task.groupId !== filterGroupId) return false
  if (!priorityEnabled.has(task.priorityRank)) return false
  if (filterColor !== 'all' && task.colorKey !== filterColor) return false
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
    completeEodForLocalDate,
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
  const [filterColor, setFilterColor] = useState<TaskColorKey | 'all'>('all')
  const [priorityEnabled, setPriorityEnabled] = useState(
    () => new Set<PriorityRank>(PRIORITY_RANKS),
  )
  const [editId, setEditId] = useState<string | null>(null)
  /** День колонки недели или выбранный день — для галочки повтора в редакторе */
  const [editOccurrenceDayKey, setEditOccurrenceDayKey] = useState<string | null>(null)
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false)
  const [draftsModalOpen, setDraftsModalOpen] = useState(false)
  const [eodOpen, setEodOpen] = useState(false)
  const [openFilterMenu, setOpenFilterMenu] = useState<'priorities' | null>(null)
  const priorityMenuRef = useRef<HTMLDivElement>(null)

  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const occurrenceDayForEdit = editOccurrenceDayKey ?? selectedDay

  const openTaskEditor = useCallback((taskId: string, dayKey?: string) => {
    setEditOccurrenceDayKey(dayKey ?? selectedDay)
    setEditId(taskId)
  }, [selectedDay])

  const closeTaskEditor = useCallback(() => {
    setEditId(null)
    setEditOccurrenceDayKey(null)
  }, [])

  useEffect(() => {
    if (!filtersPanelOpen) setOpenFilterMenu(null)
  }, [filtersPanelOpen])

  useEffect(() => {
    if (!openFilterMenu) return
    function handlePointerDown(e: MouseEvent) {
      const node = priorityMenuRef.current
      if (node && !node.contains(e.target as Node)) {
        setOpenFilterMenu(null)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openFilterMenu])

  useEffect(() => {
    if (vault.drafts.length <= 1) setDraftsModalOpen(false)
  }, [vault.drafts.length])

  useEffect(() => {
    if (!draftsModalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDraftsModalOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [draftsModalOpen])

  const syncHint = !remoteHydrated
    ? t('app.syncLoadingVault')
    : savePending
      ? t('app.syncSaving')
      : lastSyncedAt
        ? t('app.syncDone', { time: formatSynced(lastSyncedAt, locale) ?? '' })
        : t('app.syncReady')

  const canEdit = remoteHydrated && !decryptFailed

  const eodEnabled = vault.eodPreferences?.enabled !== false
  const todayKeyApp = localDateKey()
  /** Главная галочка «выполнено» и DR-004 — только при просмотре календарного сегодня. */
  const canToggleTaskCompletionOnDayView = selectedDay === todayKeyApp
  const eodDoneToday = Boolean(vault.eodCompletedLocalDates?.includes(todayKeyApp))

  const sortedGroups = useMemo(
    () => [...vault.groups].sort((a, b) => a.sortOrder - b.sortOrder),
    [vault.groups],
  )

  /** Цвета меток, которые реально есть у задач в vault */
  const taskColorKeysInUse = useMemo(() => {
    const set = new Set<TaskColorKey>()
    for (const x of vault.tasks) {
      set.add(x.colorKey)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [vault.tasks])

  useEffect(() => {
    if (filterColor !== 'all' && !taskColorKeysInUse.includes(filterColor)) {
      setFilterColor('all')
    }
  }, [filterColor, taskColorKeysInUse])

  const filteredVaultTasks = useMemo(
    () =>
      vault.tasks.filter(
        (x) =>
          taskMatchesFilters(x, filterGroupId, priorityEnabled, filterColor) &&
          passesRepeatFilter(x, filterRepeats),
      ),
    [vault.tasks, filterGroupId, priorityEnabled, filterColor, filterRepeats],
  )

  const plannedForDay = useMemo(() => {
    const list = filteredVaultTasks.filter((x) => {
      if (x.scheduledLocalDate === null && !x.recurrence) return false
      return taskHasOccurrenceOnDate(x, selectedDay)
    })
    list.sort((a, b) => sortDayPlan(a, b, selectedDay))
    return list
  }, [filteredVaultTasks, selectedDay])

  const backlogTasks = useMemo(() => {
    const list = filteredVaultTasks.filter(
      (x) => x.scheduledLocalDate === null && !x.recurrence,
    )
    list.sort(sortBacklogTasks)
    return list
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

  const priorityFilterSummary = useMemo(() => {
    if (priorityEnabled.size === PRIORITY_RANKS.length) {
      return t('app.filterPrioritiesDropdownAll')
    }
    return PRIORITY_RANKS.filter((r) => priorityEnabled.has(r))
      .map((r) => vault.priorityLabels[r])
      .join(', ')
  }, [priorityEnabled, vault.priorityLabels, t])

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
    if (filterColor !== 'all') {
      parts.push(
        t('app.informerColor', {
          name: t(`app.colorName.${filterColor}`),
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
    filterColor,
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

  const draftListItems = vault.drafts.map((d) => (
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
            setDraftsModalOpen(false)
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
  ))

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            {t('app.brand')}
          </p>
          <h1 className="text-xl font-semibold text-white">{t('app.plannerTitle')}</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              to="/app/reports"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
            >
              {t('app.reportsNav')}
            </Link>
            {eodEnabled ? (
              <button
                type="button"
                disabled={!canEdit}
                className={`rounded-lg border px-3 py-1.5 text-sm hover:border-zinc-500 disabled:opacity-40 ${
                  eodDoneToday
                    ? 'border-emerald-800 text-emerald-300'
                    : 'border-violet-700 text-violet-200'
                }`}
                onClick={() => setEodOpen(true)}
              >
                {eodDoneToday ? t('app.eodNavSummary') : t('app.eodNav')}
              </button>
            ) : null}
            <Link
              to="/settings"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
            >
              {t('app.settings')}
            </Link>
          </div>
          <p className="max-w-[14rem] text-right text-xs text-zinc-500" aria-live="polite">
            {syncHint}
          </p>
        </div>
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

      {remoteError && (
        <div className="mb-4 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          {t('app.syncErrorPrefix')} {remoteError}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={!canEdit}
            aria-expanded={filtersPanelOpen}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40"
            onClick={() => setFiltersPanelOpen((v) => !v)}
          >
            {t('app.filterToggle')}
            <span className="text-zinc-500" aria-hidden>
              {filtersPanelOpen ? '▴' : '▾'}
            </span>
          </button>
          <button
            type="button"
            disabled={!canEdit}
            className="inline-flex shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-500 disabled:opacity-40"
            onClick={() => {
              setResumeDraft(null)
              setCreateOpen(true)
            }}
          >
            {t('app.openCreateTask')}
          </button>
        </div>

        {filtersPanelOpen ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 shadow-inner">
            <p className="mb-3 text-xs font-medium text-zinc-400">{t('app.filtersTitle')}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-zinc-500">
                <span>{t('app.group')}</span>
                <select
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                  value={filterGroupId}
                  disabled={!canEdit}
                  onFocus={() => setOpenFilterMenu(null)}
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

              <div className="flex min-w-[11rem] flex-col gap-1 text-xs text-zinc-500">
                <span>{t('app.filterPriorities')}</span>
                <div className="relative" ref={priorityMenuRef}>
                  <button
                    type="button"
                    disabled={!canEdit}
                    aria-expanded={openFilterMenu === 'priorities'}
                    className="flex w-full cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-sm text-white disabled:opacity-50"
                    onClick={() =>
                      setOpenFilterMenu((v) => (v === 'priorities' ? null : 'priorities'))
                    }
                  >
                    <span className="min-w-0 flex-1 truncate">{priorityFilterSummary}</span>
                    <span className="shrink-0 text-zinc-500" aria-hidden>
                      ▾
                    </span>
                  </button>
                  {openFilterMenu === 'priorities' ? (
                    <div
                      className="absolute left-0 top-full z-30 mt-1 min-w-[14rem] rounded-lg border border-zinc-700 bg-zinc-950 p-2 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                        {PRIORITY_RANKS.map((r) => (
                          <label
                            key={r}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
                          >
                            <input
                              type="checkbox"
                              checked={priorityEnabled.has(r)}
                              disabled={!canEdit}
                              onChange={() => togglePriority(r)}
                              className="h-3.5 w-3.5 shrink-0 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
                            />
                            <span>{vault.priorityLabels[r]}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={!canEdit}
                        className="mt-2 w-full rounded border border-zinc-700 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 disabled:opacity-40"
                        onClick={() => selectAllPriorities()}
                      >
                        {t('app.filterPrioritiesAllShort')}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-zinc-500">
                <span>{t('app.filterColor')}</span>
                <select
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                  value={filterColor}
                  disabled={!canEdit}
                  onFocus={() => setOpenFilterMenu(null)}
                  onChange={(e) =>
                    setFilterColor(
                      e.target.value === 'all' ? 'all' : (e.target.value as TaskColorKey),
                    )
                  }
                >
                  <option value="all">{t('app.filterColorAll')}</option>
                  {taskColorKeysInUse.map((key) => (
                    <option key={key} value={key}>
                      {t(`app.colorName.${key}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-zinc-500">
                <span>{t('app.filterRepeats')}</span>
                <select
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                  value={filterRepeats}
                  disabled={!canEdit}
                  onFocus={() => setOpenFilterMenu(null)}
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
          </div>
        ) : null}

        {!filtersPanelOpen ? (
          <div
            className="rounded-lg border border-cyan-800/55 bg-cyan-950/45 px-3 py-2 text-xs leading-relaxed text-cyan-100/95 shadow-sm"
            role="status"
            aria-live="polite"
          >
            {informerLine}
          </div>
        ) : null}

        {vault.drafts.length === 1 ? (
          <section className="max-w-lg rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
              {t('app.draftsTitle')}
            </h3>
            <ul className="flex flex-col gap-2">{draftListItems}</ul>
          </section>
        ) : vault.drafts.length > 1 ? (
          <>
            <div className="max-w-lg">
              <button
                type="button"
                disabled={!canEdit}
                aria-haspopup="dialog"
                aria-expanded={draftsModalOpen}
                title={`${t('app.draftsTitle')}: ${vault.drafts.length}`}
                className="inline-flex w-full items-center justify-between gap-3 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-left text-sm font-medium text-amber-200 hover:bg-amber-950/35 disabled:opacity-40 sm:w-auto sm:justify-start"
                onClick={() => setDraftsModalOpen(true)}
              >
                <span>{t('app.draftsTitle')}</span>
                <span
                  className="inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600/90 px-1.5 text-xs font-semibold text-amber-950"
                  aria-hidden
                >
                  {vault.drafts.length}
                </span>
              </button>
            </div>
            {draftsModalOpen ? (
              <div
                className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4"
                role="presentation"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setDraftsModalOpen(false)
                }}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="drafts-modal-title"
                  className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
                    <h2 id="drafts-modal-title" className="text-sm font-semibold text-amber-200/90">
                      {t('app.draftsTitle')}
                    </h2>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                      aria-label={t('common.close')}
                      onClick={() => setDraftsModalOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <ul className="scrollbar-site flex max-h-[min(70vh,28rem)] flex-col gap-2 overflow-y-auto p-3">
                    {draftListItems}
                  </ul>
                </div>
              </div>
            ) : null}
          </>
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
                      occurrenceDayKey={selectedDay}
                      completionToggleAllowed={canToggleTaskCompletionOnDayView}
                      onToggle={() => void toggleTask(task.id, selectedDay)}
                      onOpen={() => openTaskEditor(task.id)}
                      onToggleChecklistItem={(itemId) =>
                        void toggleChecklistItem(task.id, itemId)
                      }
                      onClearDoubleConfirm={() =>
                        void patchTask(task.id, { doubleConfirmPending: undefined })
                      }
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
                      occurrenceDayKey={selectedDay}
                      completionToggleAllowed={canToggleTaskCompletionOnDayView}
                      onToggle={() => void toggleTask(task.id, selectedDay)}
                      onOpen={() => openTaskEditor(task.id)}
                      onToggleChecklistItem={(itemId) =>
                        void toggleChecklistItem(task.id, itemId)
                      }
                      onClearDoubleConfirm={() =>
                        void patchTask(task.id, { doubleConfirmPending: undefined })
                      }
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
            onTaskClick={(id, day) => openTaskEditor(id, day)}
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
          <div className="mx-auto w-full max-w-md">
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

      <EndOfDayModal
        open={eodOpen}
        onClose={() => setEodOpen(false)}
        ritualDateKey={todayKeyApp}
        tasks={vault.tasks}
        alreadyCompleted={eodDoneToday}
        canEdit={canEdit}
        onCompleteRitual={() => completeEodForLocalDate(todayKeyApp)}
      />

      {editingTask ? (
        <TaskEditModal
          key={editingTask.id}
          task={editingTask}
          groups={vault.groups}
          priorityLabels={vault.priorityLabels}
          selectedDayKey={selectedDay}
          occurrenceDayKey={occurrenceDayForEdit}
          todayLocalDateKey={todayKeyApp}
          canEdit={canEdit}
          onApplyTaskPatch={(patch) => void patchTask(editingTask.id, patch)}
          onClose={closeTaskEditor}
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
          onToggleOccurrenceForDay={
            editingTask.recurrence
              ? () => void toggleTask(editingTask.id, occurrenceDayForEdit)
              : undefined
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
