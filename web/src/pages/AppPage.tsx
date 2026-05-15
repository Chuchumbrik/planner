import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { motivatorAppRole } from '@/lib/motivatorRole'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { DayPlanDonut } from '@/components/DayPlanDonut'
import { PeriodPlanBreakdownChart } from '@/components/PeriodPlanBreakdownChart'
import { PeriodPlanDonut } from '@/components/PeriodPlanDonut'
import { EndOfDayModal } from '@/components/EndOfDayModal'
import { ProductRoadmapModal } from '@/components/ProductRoadmapModal'
import { MonthCalendar } from '@/components/MonthCalendar'
import { WeekGrid } from '@/components/WeekGrid'
import { TaskEditModal } from '@/components/TaskEditModal'
import { TaskMiniCard } from '@/components/TaskMiniCard'
import { RequireVault } from '@/components/RequireVault'
import { tasksVisibleInPlannerView } from '@/lib/plannerFilterScope'
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
  isPlannedTaskFullyCompleteForDay,
  plannedPeriodProgress,
  plannedPeriodSlotsByColorKey,
  plannedPeriodSlotsByGroupId,
  taskOccursOnDate,
  tasksScheduledForPlannerDay,
  getTaskSlotMinutes,
  weekDayKeys,
  withTaskPatch,
  type PriorityRank,
  type Task,
  type TaskColorKey,
  type TaskDraft,
} from '@motivator/core'
import { useVault } from '@/vault/VaultProvider'

/** Фон строки плана на «День»: зелёный при полном выполнении; оранжевый при закрытом EOD и неполном; иначе нейтральный. */
function dayPlanRowSurfaceClass(opts: {
  selectedDay: string
  todayKey: string
  eodClosedForDay: boolean
  task: Task
}): string | undefined {
  const { selectedDay, todayKey, eodClosedForDay, task } = opts
  const past = selectedDay < todayKey
  if (isPlannedTaskFullyCompleteForDay(task, selectedDay)) {
    return past
      ? 'border-emerald-900/45 bg-emerald-950/50'
      : 'border-emerald-900/35 bg-emerald-950/32'
  }
  if (eodClosedForDay) {
    return past
      ? 'border-amber-900/45 bg-amber-950/48'
      : 'border-amber-900/30 bg-amber-950/22'
  }
  return undefined
}

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

function humanizeRemoteError(raw: string | null, t: (k: string) => string): string {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (
    lower.includes('typeerror') ||
    lower.includes('load failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    (lower.includes('fetch') && lower.includes('fail'))
  ) {
    return t('app.syncErrorGeneric')
  }
  return raw
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

/** Короткий диапазон недели для шапки (1–2 строки на мобилке). */
function formatWeekRangeCompact(firstKey: string, lastKey: string, locale: string): string {
  const part = (key: string) => {
    const [y, mo, d] = key.split('-').map(Number)
    const dt = new Date(y, mo - 1, d)
    try {
      return dt.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    } catch {
      return key
    }
  }
  return `${part(firstKey)} — ${part(lastKey)}`
}

function sortByPriorityThenTitle(a: Task, b: Task): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
}

/** Невыполненные выше; с временем — по началу слота; без времени — после них, по приоритету и названию. */
function sortDayPlan(a: Task, b: Task, dayKey: string): number {
  const aDone = isMainTaskDoneForDay(a, dayKey)
  const bDone = isMainTaskDoneForDay(b, dayKey)
  if (aDone !== bDone) return aDone ? 1 : -1

  const sa = getTaskSlotMinutes(a, dayKey)
  const sb = getTaskSlotMinutes(b, dayKey)
  if (sa && sb) {
    if (sa.start !== sb.start) return sa.start - sb.start
    if (sa.end !== sb.end) return sa.end - sb.end
    return sortByPriorityThenTitle(a, b)
  }
  if (sa && !sb) return -1
  if (!sa && sb) return 1
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

function matchesFiltersExcept(
  task: Task,
  exclude: 'group' | 'color' | 'priority' | 'repeat',
  filterGroupId: string | 'all',
  priorityEnabled: Set<PriorityRank>,
  filterColor: TaskColorKey | 'all',
  filterRepeats: 'all' | 'recurring' | 'nonRecurring',
): boolean {
  if (exclude !== 'group' && filterGroupId !== 'all' && task.groupId !== filterGroupId) return false
  if (exclude !== 'priority' && !priorityEnabled.has(task.priorityRank)) return false
  if (exclude !== 'color' && filterColor !== 'all' && task.colorKey !== filterColor) return false
  if (exclude !== 'repeat' && !passesRepeatFilter(task, filterRepeats)) return false
  return true
}

/** Иконки навигации периода — те же SVG, что на вкладке «Неделя». */
function PlannerChevronLeft() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
    </svg>
  )
}

function PlannerChevronRight() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
    </svg>
  )
}

type EodModalContext = { dateKey: string; mode: 'ritual' | 'report' }

function AppPageInner() {
  const { t, i18n } = useTranslation()
  const { signOut, session } = useAuth()
  const {
    vault,
    remoteError,
    retryRemoteHydrate,
    remoteHydrated,
    decryptFailed,
    savePending,
    lastSyncedAt,
    lock,
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
  /** Рядом с кольцом недели/месяца: столбчатая диаграмма по группам или по цветам. */
  const [periodSlotsMode, setPeriodSlotsMode] = useState<'group' | 'color'>('group')
  /** `lg+`: кольцо недели и график столбиком; уже — в одну строку с компактным кольцом. */
  const [weekPlanUiWide, setWeekPlanUiWide] = useState(() =>
    typeof globalThis !== 'undefined' && 'matchMedia' in globalThis
      ? globalThis.matchMedia('(min-width: 1024px)').matches
      : false,
  )
  const [eodModalContext, setEodModalContext] = useState<EodModalContext | null>(null)
  const [openFilterMenu, setOpenFilterMenu] = useState<'priorities' | null>(null)
  const priorityMenuRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false)

  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const accountRoleLabel = useMemo(() => {
    const r = motivatorAppRole(session)
    if (r === 'admin') return t('shell.roleLabelAdmin')
    if (r === 'beta_tester') return t('shell.roleLabelBetaTester')
    return t('shell.roleLabelUser')
  }, [session, t])

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
    if (!accountMenuOpen) return
    function handlePointerDown(e: MouseEvent) {
      const node = accountMenuRef.current
      if (node && !node.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [accountMenuOpen])

  useEffect(() => {
    if (vault.drafts.length === 0) setDraftsModalOpen(false)
  }, [vault.drafts.length])

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !('matchMedia' in globalThis)) return
    const mq = globalThis.matchMedia('(min-width: 1024px)')
    const fn = () => setWeekPlanUiWide(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

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

  const weekDays = useMemo(() => weekDayKeys(weekStartMonday), [weekStartMonday])

  const monthMatrix = useMemo(
    () => monthWeekMatrix(monthYear, monthIndex),
    [monthYear, monthIndex],
  )

  const monthDayKeysForPlan = useMemo(() => {
    const keys: string[] = []
    for (const row of monthMatrix) {
      for (const cell of row) {
        if ('dateKey' in cell) keys.push(cell.dateKey)
      }
    }
    keys.sort()
    return keys
  }, [monthMatrix])

  /** Задачи текущего вида (день / неделя / месяц) — источник опций фильтров. */
  const tasksScopedForFilters = useMemo(
    () =>
      tasksVisibleInPlannerView(vault.tasks, view, {
        selectedDay,
        weekDays,
        monthYear,
        monthIndex,
      }),
    [vault.tasks, view, selectedDay, weekDays, monthYear, monthIndex],
  )

  const groupIdsForFilterUi = useMemo(() => {
    const ids = new Set<string>()
    for (const t of tasksScopedForFilters) {
      if (
        !matchesFiltersExcept(
          t,
          'group',
          filterGroupId,
          priorityEnabled,
          filterColor,
          filterRepeats,
        )
      )
        continue
      ids.add(t.groupId)
    }
    return ids
  }, [
    tasksScopedForFilters,
    filterGroupId,
    priorityEnabled,
    filterColor,
    filterRepeats,
  ])

  const colorKeysForFilterUi = useMemo(() => {
    const set = new Set<TaskColorKey>()
    for (const t of tasksScopedForFilters) {
      if (
        !matchesFiltersExcept(
          t,
          'color',
          filterGroupId,
          priorityEnabled,
          filterColor,
          filterRepeats,
        )
      )
        continue
      set.add(t.colorKey)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [
    tasksScopedForFilters,
    filterGroupId,
    priorityEnabled,
    filterColor,
    filterRepeats,
  ])

  const priorityRanksForFilterMenu = useMemo(() => {
    const ranks = new Set<PriorityRank>()
    for (const t of tasksScopedForFilters) {
      if (
        !matchesFiltersExcept(
          t,
          'priority',
          filterGroupId,
          priorityEnabled,
          filterColor,
          filterRepeats,
        )
      )
        continue
      ranks.add(t.priorityRank)
    }
    const list = PRIORITY_RANKS.filter((r) => ranks.has(r))
    return list.length > 0 ? list : PRIORITY_RANKS
  }, [
    tasksScopedForFilters,
    filterGroupId,
    priorityEnabled,
    filterColor,
    filterRepeats,
  ])

  const repeatKindsInScope = useMemo(() => {
    let rec = false
    let non = false
    for (const t of tasksScopedForFilters) {
      if (
        !matchesFiltersExcept(
          t,
          'repeat',
          filterGroupId,
          priorityEnabled,
          filterColor,
          filterRepeats,
        )
      )
        continue
      if (t.recurrence) rec = true
      else non = true
    }
    return { rec, non }
  }, [
    tasksScopedForFilters,
    filterGroupId,
    priorityEnabled,
    filterColor,
    filterRepeats,
  ])

  useEffect(() => {
    if (filterColor !== 'all' && !colorKeysForFilterUi.includes(filterColor)) {
      setFilterColor('all')
    }
  }, [filterColor, colorKeysForFilterUi])

  useEffect(() => {
    if (filterGroupId !== 'all' && !groupIdsForFilterUi.has(filterGroupId)) {
      setFilterGroupId('all')
    }
  }, [filterGroupId, groupIdsForFilterUi])

  useEffect(() => {
    if (filterRepeats === 'recurring' && !repeatKindsInScope.rec) setFilterRepeats('all')
    if (filterRepeats === 'nonRecurring' && !repeatKindsInScope.non) setFilterRepeats('all')
  }, [filterRepeats, repeatKindsInScope])

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
    const list = tasksScheduledForPlannerDay(filteredVaultTasks, selectedDay)
    list.sort((a, b) => sortDayPlan(a, b, selectedDay))
    return list
  }, [filteredVaultTasks, selectedDay])

  const eodClosedForSelectedDay = useMemo(
    () => Boolean(vault.eodCompletedLocalDates?.includes(selectedDay)),
    [vault.eodCompletedLocalDates, selectedDay],
  )

  const weekPlanProgress = useMemo(
    () => plannedPeriodProgress(filteredVaultTasks, weekDays, todayKeyApp),
    [filteredVaultTasks, weekDays, todayKeyApp],
  )

  const monthPlanProgress = useMemo(
    () => plannedPeriodProgress(filteredVaultTasks, monthDayKeysForPlan, todayKeyApp),
    [filteredVaultTasks, monthDayKeysForPlan, todayKeyApp],
  )

  const weekBreakdownChartRows = useMemo((): { name: string; pct: number }[] => {
    const buckets =
      periodSlotsMode === 'group'
        ? plannedPeriodSlotsByGroupId(filteredVaultTasks, weekDays, todayKeyApp)
        : plannedPeriodSlotsByColorKey(filteredVaultTasks, weekDays, todayKeyApp)
    return buckets.map((b) => ({
      name:
        periodSlotsMode === 'group'
          ? sortedGroups.find((g) => g.id === b.key)?.name ?? b.key
          : t(`app.colorName.${b.key as TaskColorKey}`),
      pct: b.slotCount > 0 ? Math.round((100 * b.doneFractionSum) / b.slotCount) : 0,
    }))
  }, [filteredVaultTasks, weekDays, todayKeyApp, periodSlotsMode, sortedGroups, t])

  const monthBreakdownChartRows = useMemo((): { name: string; pct: number }[] => {
    const buckets =
      periodSlotsMode === 'group'
        ? plannedPeriodSlotsByGroupId(filteredVaultTasks, monthDayKeysForPlan, todayKeyApp)
        : plannedPeriodSlotsByColorKey(filteredVaultTasks, monthDayKeysForPlan, todayKeyApp)
    return buckets.map((b) => ({
      name:
        periodSlotsMode === 'group'
          ? sortedGroups.find((g) => g.id === b.key)?.name ?? b.key
          : t(`app.colorName.${b.key as TaskColorKey}`),
      pct: b.slotCount > 0 ? Math.round((100 * b.doneFractionSum) / b.slotCount) : 0,
    }))
  }, [filteredVaultTasks, monthDayKeysForPlan, todayKeyApp, periodSlotsMode, sortedGroups, t])

  const backlogTasks = useMemo(() => {
    const list = filteredVaultTasks.filter(
      (x) => x.scheduledLocalDate === null && !x.recurrence,
    )
    list.sort(sortBacklogTasks)
    return list
  }, [filteredVaultTasks])

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

  function resetAllFilters() {
    setFilterGroupId('all')
    setPriorityEnabled(new Set(PRIORITY_RANKS))
    setFilterColor('all')
    setFilterRepeats('all')
  }

  async function handleSignOut() {
    setAccountMenuOpen(false)
    await lock()
    await signOut()
  }

  const priorityFilterSummary = useMemo(() => {
    if (priorityEnabled.size === PRIORITY_RANKS.length) {
      return t('app.filterPrioritiesDropdownAll')
    }
    return PRIORITY_RANKS.filter((r) => priorityEnabled.has(r))
      .map((r) => vault.priorityLabels[r])
      .join(', ')
  }, [priorityEnabled, vault.priorityLabels, t])

  /** Информер нужен только когда что-то отличается от «всё по умолчанию». */
  const filtersInformerActive = useMemo(() => {
    if (filterGroupId !== 'all') return true
    if (priorityEnabled.size !== PRIORITY_RANKS.length) return true
    if (filterColor !== 'all') return true
    if (filterRepeats !== 'all') return true
    return false
  }, [filterGroupId, priorityEnabled, filterColor, filterRepeats])

  type FilterChip = { key: string; label: string; onRemove: () => void }

  const activeFilterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = []
    if (filterGroupId !== 'all') {
      const g = vault.groups.find((x) => x.id === filterGroupId)
      chips.push({
        key: 'group',
        label: t('app.filterChipGroup', { name: g?.name ?? filterGroupId }),
        onRemove: () => setFilterGroupId('all'),
      })
    }
    if (priorityEnabled.size !== PRIORITY_RANKS.length) {
      chips.push({
        key: 'priority',
        label: t('app.filterChipPriorities', {
          labels: PRIORITY_RANKS.filter((r) => priorityEnabled.has(r))
            .map((r) => vault.priorityLabels[r])
            .join(', '),
        }),
        onRemove: selectAllPriorities,
      })
    }
    if (filterColor !== 'all') {
      chips.push({
        key: 'color',
        label: t('app.filterChipColor', { name: t(`app.colorName.${filterColor}`) }),
        onRemove: () => setFilterColor('all'),
      })
    }
    if (filterRepeats === 'recurring') {
      chips.push({
        key: 'repeat',
        label: t('app.filterChipRepeatsRecurring'),
        onRemove: () => setFilterRepeats('all'),
      })
    } else if (filterRepeats === 'nonRecurring') {
      chips.push({
        key: 'repeat',
        label: t('app.filterChipRepeatsNon'),
        onRemove: () => setFilterRepeats('all'),
      })
    }
    return chips
  }, [
    filterGroupId,
    priorityEnabled,
    filterColor,
    filterRepeats,
    vault.groups,
    vault.priorityLabels,
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
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-8">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            {t('app.brand')}
          </p>
          <h1 className="text-xl font-semibold text-white">{t('app.plannerTitle')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-md border px-2 py-1.5 text-xs hover:bg-zinc-900/80 disabled:opacity-40 ${
              remoteError
                ? 'border-amber-900/50 text-amber-300/90'
                : savePending
                  ? 'border-zinc-700/80 text-zinc-500'
                  : 'border-transparent text-zinc-600 hover:text-zinc-400'
            }`}
            title={syncHint}
            aria-label={t('app.syncIconAria')}
          >
            <span className="sr-only">{syncHint}</span>
            <span aria-hidden className="text-[0.85rem] leading-none opacity-90">
              {savePending ? '…' : remoteError ? '⚠' : '✓'}
            </span>
          </button>
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-2.5 py-2 text-zinc-300 hover:bg-zinc-900"
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              onClick={() => setAccountMenuOpen((v) => !v)}
            >
              <span className="sr-only">{t('app.accountMenuAria')}</span>
              <svg
                aria-hidden
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </button>
            {accountMenuOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-zinc-700 bg-zinc-950 py-1 shadow-xl"
                role="menu"
              >
                <div
                  className="border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400"
                  role="presentation"
                >
                  {t('app.accountMenuRoleLine', { role: accountRoleLabel })}
                </div>
                <Link
                  to="/app/reports"
                  role="menuitem"
                  className="block px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  {t('app.reportsNav')}
                </Link>
                {eodEnabled ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canEdit}
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
                    onClick={() => {
                      setAccountMenuOpen(false)
                      setEodModalContext({ dateKey: todayKeyApp, mode: 'ritual' })
                    }}
                  >
                    {eodDoneToday ? t('app.eodNavSummary') : t('app.eodNav')}
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900"
                  onClick={() => {
                    setAccountMenuOpen(false)
                    setRoadmapModalOpen(true)
                  }}
                >
                  {t('settings.roadmapTempButton')}
                </button>
                <Link
                  to="/settings"
                  role="menuitem"
                  className="block px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  {t('app.settings')}
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-900"
                  onClick={() => void handleSignOut()}
                >
                  {t('settings.signOut')}
                </button>
              </div>
            ) : null}
          </div>
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

      {remoteError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          <p className="min-w-0 flex-1 leading-snug">
            {humanizeRemoteError(remoteError, t)}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-amber-600/60 bg-amber-950/50 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/40"
            onClick={() => retryRemoteHydrate()}
          >
            {t('app.syncRetry')}
          </button>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative shrink-0">
            <button
              type="button"
              disabled={!canEdit}
              aria-expanded={filtersPanelOpen}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 pr-5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40"
              onClick={() => setFiltersPanelOpen((v) => !v)}
            >
              {t('app.filterToggle')}
              <span className="text-zinc-500" aria-hidden>
                {filtersPanelOpen ? '▴' : '▾'}
              </span>
            </button>
          </div>
          {view === 'day' && eodEnabled ? (
            selectedDay > todayKeyApp ? null : selectedDay < todayKeyApp ? (
              <button
                type="button"
                disabled={!canEdit}
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-40"
                onClick={() =>
                  setEodModalContext({ dateKey: selectedDay, mode: 'report' })
                }
              >
                {t('app.dayReportNav')}
              </button>
            ) : (
              <button
                type="button"
                disabled={!canEdit}
                className={`rounded-lg border px-3 py-2 text-sm hover:border-zinc-500 disabled:opacity-40 ${
                  eodDoneToday
                    ? 'border-emerald-800 text-emerald-300'
                    : 'border-violet-700 text-violet-200'
                }`}
                onClick={() =>
                  setEodModalContext({ dateKey: todayKeyApp, mode: 'ritual' })
                }
              >
                {eodDoneToday ? t('app.eodNavSummary') : t('app.eodNav')}
              </button>
            )
          ) : null}
          <div className="relative shrink-0">
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
            {vault.drafts.length > 0 ? (
              <button
                type="button"
                disabled={!canEdit}
                aria-haspopup="dialog"
                aria-expanded={draftsModalOpen}
                aria-label={`${t('app.draftsTitle')}: ${vault.drafts.length}`}
                title={`${t('app.draftsTitle')}: ${vault.drafts.length}`}
                className="absolute -right-0.5 -top-1.5 z-10 flex h-6 min-w-[1.35rem] items-center justify-center rounded-full border border-amber-700/80 bg-amber-500 px-1 text-[11px] font-bold text-amber-950 shadow-md hover:bg-amber-400 disabled:opacity-40"
                onClick={(e) => {
                  e.stopPropagation()
                  setDraftsModalOpen(true)
                }}
              >
                {vault.drafts.length > 99 ? '99+' : vault.drafts.length}
              </button>
            ) : null}
          </div>
        </div>

        {filtersPanelOpen ? (
          <>
            <div
              className="fixed inset-0 z-[44] bg-black/65 md:hidden"
              aria-hidden
              onClick={() => setFiltersPanelOpen(false)}
            />
            <div className="relative z-[45] md:z-auto">
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 shadow-inner max-md:fixed max-md:inset-0 max-md:z-[45] max-md:flex max-md:flex-col max-md:overflow-hidden max-md:rounded-none max-md:border-0 max-md:bg-zinc-950 max-md:p-0 md:p-3">
                <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3 md:hidden">
                  <span className="text-sm font-medium text-zinc-200">{t('app.filtersTitle')}</span>
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
                    onClick={() => setFiltersPanelOpen(false)}
                  >
                    {t('app.filtersSheetDone')}
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 md:overflow-visible md:p-0">
                  <p className="mb-3 hidden text-xs font-medium text-zinc-400 md:block">{t('app.filtersTitle')}</p>
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
                  {sortedGroups
                    .filter((g) => groupIdsForFilterUi.has(g.id))
                    .map((g) => (
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
                        {priorityRanksForFilterMenu.map((r) => (
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
                  {colorKeysForFilterUi.map((key) => (
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
                  {repeatKindsInScope.rec ? (
                    <option value="recurring">{t('app.filterRepeatsRecurring')}</option>
                  ) : null}
                  {repeatKindsInScope.non ? (
                    <option value="nonRecurring">{t('app.filterRepeatsNonRecurring')}</option>
                  ) : null}
                </select>
              </label>
            </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {!filtersPanelOpen && filtersInformerActive ? (
          <div
            className="flex flex-wrap items-center gap-2"
            role="status"
            aria-live="polite"
          >
            {activeFilterChips.map((c) => (
              <span
                key={c.key}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-cyan-800/50 bg-cyan-950/40 py-1 pl-2.5 pr-1 text-[11px] text-cyan-100"
              >
                <span className="min-w-0 truncate">{c.label}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-cyan-200/90 hover:bg-cyan-900/60"
                  onClick={c.onRemove}
                  aria-label={t('common.close')}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              className="text-[11px] font-medium text-cyan-300/95 underline decoration-cyan-600/80 underline-offset-2 hover:text-cyan-200"
              onClick={resetAllFilters}
            >
              {t('app.filtersResetAll')}
            </button>
          </div>
        ) : null}

        {draftsModalOpen && vault.drafts.length > 0 ? (
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
          <div className="mb-4 flex flex-nowrap items-center justify-between gap-2">
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                disabled={!canEdit}
                className="rounded-lg border border-zinc-700 p-2 text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
                onClick={() => setSelectedDay(shiftLocalDateKey(selectedDay, -1))}
                aria-label={t('app.dayPrev')}
              >
                <span className="sr-only">{t('app.dayPrev')}</span>
                <PlannerChevronLeft />
              </button>
              <button
                type="button"
                disabled={!canEdit}
                className="rounded-lg border border-zinc-700 p-2 text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
                onClick={() => setSelectedDay(shiftLocalDateKey(selectedDay, 1))}
                aria-label={t('app.dayNext')}
              >
                <span className="sr-only">{t('app.dayNext')}</span>
                <PlannerChevronRight />
              </button>
            </div>
            <p className="min-w-0 flex-1 truncate px-1 text-center text-xs leading-tight text-zinc-300 sm:text-sm">
              {formatDayHeading(selectedDay, locale)}
            </p>
            <button
              type="button"
              disabled={!canEdit}
              className="shrink-0 rounded-lg border border-emerald-800/60 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40 sm:px-3 sm:text-sm"
              onClick={() => setSelectedDay(localDateKey())}
            >
              {t('app.today')}
            </button>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t('app.sectionPlanned')}
            </h2>
            <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start lg:gap-10">
              <div className="min-w-0 w-full lg:max-w-lg lg:shrink-0">
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
                          occurrenceDayKey={selectedDay}
                          completionToggleAllowed={canToggleTaskCompletionOnDayView}
                          planRowSurfaceClass={dayPlanRowSurfaceClass({
                            selectedDay,
                            todayKey: todayKeyApp,
                            eodClosedForDay: eodClosedForSelectedDay,
                            task,
                          })}
                          onToggle={() => void toggleTask(task.id, selectedDay)}
                          onOpen={() => openTaskEditor(task.id)}
                          onToggleChecklistItem={(itemId) =>
                            void toggleChecklistItem(task.id, itemId, selectedDay)
                          }
                          onClearDoubleConfirm={() =>
                            void patchTask(task.id, { doubleConfirmPending: undefined })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex w-full min-w-0 flex-1 justify-center lg:min-h-[1px] lg:justify-center lg:pt-0.5">
                <DayPlanDonut plannedTasksForDay={plannedForDay} dayKey={selectedDay} />
              </div>
            </div>
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
                        void toggleChecklistItem(task.id, itemId, selectedDay)
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
        <section className="flex min-h-0 flex-1 flex-col space-y-3">
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                disabled={!canEdit}
                className="rounded-lg border border-zinc-700 p-2 text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
                onClick={() => setWeekStartMonday((w) => shiftWeekStartMonday(w, -1))}
                aria-label={t('app.weekPrev')}
              >
                <span className="sr-only">{t('app.weekPrev')}</span>
                <PlannerChevronLeft />
              </button>
              <button
                type="button"
                disabled={!canEdit}
                className="rounded-lg border border-zinc-700 p-2 text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
                onClick={() => setWeekStartMonday((w) => shiftWeekStartMonday(w, 1))}
                aria-label={t('app.weekNext')}
              >
                <span className="sr-only">{t('app.weekNext')}</span>
                <PlannerChevronRight />
              </button>
            </div>
            <p className="min-w-0 flex-1 truncate px-1 text-center text-xs leading-tight text-zinc-300 sm:text-sm">
              {formatWeekRangeCompact(weekDays[0], weekDays[6], locale)}
            </p>
            <button
              type="button"
              disabled={!canEdit}
              className="shrink-0 rounded-lg border border-emerald-800/60 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40 sm:px-3 sm:text-sm"
              onClick={() => setWeekStartMonday(startOfWeekMonday(localDateKey()))}
            >
              {t('app.weekThis')}
            </button>
          </div>
          <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col-reverse gap-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <WeekGrid
                weekDays={weekDays}
                tasks={filteredVaultTasks}
                priorityLabels={vault.priorityLabels}
                locale={locale}
                canEdit={canEdit}
                onTaskClick={(id, day) => openTaskEditor(id, day)}
              />
            </div>
            {weekPlanProgress.plannedTaskCount > 0 ? (
              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 lg:w-[min(100%,300px)] lg:pt-1">
                <div className="flex min-h-0 flex-row items-stretch gap-2 lg:flex-col lg:gap-2">
                  <div className="flex w-[min(104px,28vw)] max-w-[112px] shrink-0 justify-center self-start lg:w-full lg:max-w-none">
                    <PeriodPlanDonut
                      progress={weekPlanProgress}
                      title={t('app.periodPlanWeekRingTitle')}
                      subtitle={formatWeekRangeCompact(weekDays[0], weekDays[6], locale)}
                      ringSize={weekPlanUiWide ? 120 : 92}
                      ringStroke={weekPlanUiWide ? 10 : 8}
                    />
                  </div>
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:w-full">
                    <PeriodPlanBreakdownChart
                      compact={!weekPlanUiWide}
                      rows={weekBreakdownChartRows}
                      title={
                        periodSlotsMode === 'group'
                          ? t('app.periodBreakdownChartTitleGroup')
                          : t('app.periodBreakdownChartTitleColor')
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-center gap-1">
                  <button
                    type="button"
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium sm:text-xs ${
                      periodSlotsMode === 'group'
                        ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
                        : 'border-zinc-700 text-zinc-500 hover:bg-zinc-900'
                    }`}
                    onClick={() => setPeriodSlotsMode('group')}
                  >
                    {t('app.periodBreakdownByGroup')}
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium sm:text-xs ${
                      periodSlotsMode === 'color'
                        ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
                        : 'border-zinc-700 text-zinc-500 hover:bg-zinc-900'
                    }`}
                    onClick={() => setPeriodSlotsMode('color')}
                  >
                    {t('app.periodBreakdownByColor')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {view === 'month' && (
        <section className="space-y-4">
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                disabled={!canEdit}
                className="rounded-lg border border-zinc-700 p-2 text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
                onClick={() => {
                  const d = new Date(monthYear, monthIndex - 1, 1)
                  setMonthYear(d.getFullYear())
                  setMonthIndex(d.getMonth())
                }}
                aria-label={t('app.monthPrev')}
              >
                <span className="sr-only">{t('app.monthPrev')}</span>
                <PlannerChevronLeft />
              </button>
              <button
                type="button"
                disabled={!canEdit}
                className="rounded-lg border border-zinc-700 p-2 text-zinc-200 hover:bg-zinc-900 disabled:opacity-40"
                onClick={() => {
                  const d = new Date(monthYear, monthIndex + 1, 1)
                  setMonthYear(d.getFullYear())
                  setMonthIndex(d.getMonth())
                }}
                aria-label={t('app.monthNext')}
              >
                <span className="sr-only">{t('app.monthNext')}</span>
                <PlannerChevronRight />
              </button>
            </div>
            <p className="min-w-0 flex-1 truncate px-1 text-center text-xs leading-tight text-zinc-300 sm:text-sm">
              {monthLabel(monthYear, monthIndex, locale)}
            </p>
            <button
              type="button"
              disabled={!canEdit}
              className="shrink-0 rounded-lg border border-emerald-800/60 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40 sm:px-3 sm:text-sm"
              onClick={() => {
                const now = parseLocalDateKey(localDateKey())!
                setMonthYear(now.getFullYear())
                setMonthIndex(now.getMonth())
              }}
            >
              {t('app.monthThis')}
            </button>
          </div>
          <div className="mx-auto flex w-full max-w-5xl flex-col-reverse items-stretch gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
            <div className="mx-auto w-full max-w-md min-w-0 flex-1 lg:mx-0">
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
            {monthPlanProgress.plannedTaskCount > 0 ? (
              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 lg:w-[min(100%,300px)] lg:justify-end lg:pt-1">
                <PeriodPlanDonut
                  progress={monthPlanProgress}
                  title={t('app.periodPlanMonthRingTitle')}
                  subtitle={monthLabel(monthYear, monthIndex, locale)}
                />
                <div className="flex justify-center gap-1">
                  <button
                    type="button"
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium sm:text-xs ${
                      periodSlotsMode === 'group'
                        ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
                        : 'border-zinc-700 text-zinc-500 hover:bg-zinc-900'
                    }`}
                    onClick={() => setPeriodSlotsMode('group')}
                  >
                    {t('app.periodBreakdownByGroup')}
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium sm:text-xs ${
                      periodSlotsMode === 'color'
                        ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
                        : 'border-zinc-700 text-zinc-500 hover:bg-zinc-900'
                    }`}
                    onClick={() => setPeriodSlotsMode('color')}
                  >
                    {t('app.periodBreakdownByColor')}
                  </button>
                </div>
                <PeriodPlanBreakdownChart
                  rows={monthBreakdownChartRows}
                  title={
                    periodSlotsMode === 'group'
                      ? t('app.periodBreakdownChartTitleGroup')
                      : t('app.periodBreakdownChartTitleColor')
                  }
                />
              </div>
            ) : null}
          </div>
        </section>
      )}

      <EndOfDayModal
        open={eodModalContext !== null}
        onClose={() => setEodModalContext(null)}
        ritualDateKey={eodModalContext?.dateKey ?? todayKeyApp}
        tasks={vault.tasks}
        mode={eodModalContext?.mode ?? 'ritual'}
        alreadyCompleted={
          eodModalContext?.mode === 'report'
            ? Boolean(vault.eodCompletedLocalDates?.includes(eodModalContext.dateKey))
            : eodDoneToday
        }
        canEdit={canEdit}
        onCompleteRitual={() => completeEodForLocalDate(todayKeyApp)}
      />

      <ProductRoadmapModal open={roadmapModalOpen} onClose={() => setRoadmapModalOpen(false)} />

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
            void toggleChecklistItem(editingTask.id, itemId, occurrenceDayForEdit)
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
