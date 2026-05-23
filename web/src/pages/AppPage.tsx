import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { motivatorAppRole } from '@/lib/motivatorRole'
import { AiCommandStub } from '@/components/planner/AiCommandStub'
import { DayPlannerStatsRow } from '@/components/planner/DayPlannerStatsRow'
import { PeriodPlannerStatsRow } from '@/components/planner/PeriodPlannerStatsRow'
import { PlannerCreateFab } from '@/components/planner/PlannerCreateFab'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
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
import { VaultDecryptHelp } from '@/components/VaultDecryptHelp'
import { tasksVisibleInPlannerView } from '@/lib/plannerFilterScope'
import { cn } from '@/lib/cn'
import {
  humanizeConnectivityError,
  isLikelyNetworkFetchFailure,
} from '@/lib/connectivityHints'
import {
  DRAFT_LIST_ITEM,
  EMPTY_STATE_BOX,
  FILTER_CHIP,
  FILTER_CHIP_DISMISS,
  FILTER_CHIP_RESET,
  FILTER_PANEL,
  MODAL_CLOSE_BTN,
  MODAL_HEADER,
  MODAL_SHELL,
  MOTIVATOR_INPUT,
  PLANNER_NAV_BTN,
  PLANNER_SECTION_HEAD,
  SETTINGS_BTN_SECONDARY,
  SETTINGS_LABEL,
  VIEW_TABLIST,
  periodBreakdownToggle,
  viewTab,
} from '@/lib/designClasses'
import { isPlannerTaskOverdue } from '@/lib/plannerTaskDayStatus'
import { readPlannerChartsHidden, writePlannerChartsHidden } from '@/lib/plannerChartsPref'
import {
  countHiddenByFilterInDays,
  countOverdueInDays,
  summarizePlannerDay,
} from '@/lib/plannerPeriodStats'
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
  plannedDayCompletionWeights,
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
      ? 'border-primary/35 bg-primary/15'
      : 'border-primary/25 bg-primary/10'
  }
  if (eodClosedForDay) {
    return past
      ? 'border-tertiary-container/40 bg-tertiary-container/10'
      : 'border-tertiary-container/30 bg-tertiary-container/5'
  }
  if (isPlannerTaskOverdue(task, selectedDay, todayKey)) {
    return 'border-tertiary/45 bg-tertiary-container/10'
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

/** Иконка переключателя «диаграммы» (кольцо + столбцы) — вместо длинной подписи на мобилке. */
/** Навигация периода: стрелки по обе стороны подписи даты/недели/месяца (#61). */
function PlannerPeriodNav({
  canEdit,
  dateLabel,
  onPrev,
  onNext,
  onJumpToCurrent,
  prevAriaLabel,
  nextAriaLabel,
  jumpLabel,
  className = 'mb-4',
}: {
  canEdit: boolean
  dateLabel: string
  onPrev: () => void
  onNext: () => void
  onJumpToCurrent: () => void
  prevAriaLabel: string
  nextAriaLabel: string
  jumpLabel: string
  className?: string
}) {
  return (
    <div className={`flex flex-nowrap items-center gap-1.5 sm:gap-2 ${className}`}>
      <button
        type="button"
        disabled={!canEdit}
        className={PLANNER_NAV_BTN}
        onClick={onPrev}
        aria-label={prevAriaLabel}
      >
        <span className="sr-only">{prevAriaLabel}</span>
        <PlannerChevronLeft />
      </button>
      <p className="min-w-0 flex-1 truncate px-0.5 text-center font-display text-xs leading-tight text-on-surface sm:text-sm">
        {dateLabel}
      </p>
      <button
        type="button"
        disabled={!canEdit}
        className={PLANNER_NAV_BTN}
        onClick={onNext}
        aria-label={nextAriaLabel}
      >
        <span className="sr-only">{nextAriaLabel}</span>
        <PlannerChevronRight />
      </button>
      <button
        type="button"
        disabled={!canEdit}
        className="btn-secondary ml-auto shrink-0 px-2 py-1.5 text-xs disabled:opacity-40 sm:px-3 sm:text-sm"
        onClick={onJumpToCurrent}
      >
        {jumpLabel}
      </button>
    </div>
  )
}

function PlannerChartsIcon({ chartsHidden }: { chartsHidden: boolean }) {
  if (chartsHidden) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M3 3h2v14H3V3zm4 6h2v8H7V9zm4-4h2v12h-2V5zm4 3h2v9h-2V8z" opacity="0.35" />
        <path
          fillRule="evenodd"
          d="M2.293 2.293a1 1 0 011.414 0l14 14a1 1 0 01-1.414 1.414l-14-14a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M3 14h2.5v4H3v-4zm4.25-6h2.5v10h-2.5V8zm4.25-4h2.5v14h-2.5V4zm4.25 3h2.5v11h-2.5V7z" />
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
    skipTaskOccurrenceForDay,
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
  const [chartsHidden, setChartsHidden] = useState(() =>
    typeof window !== 'undefined' ? readPlannerChartsHidden() : false,
  )

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

  const dayPlanProgress = useMemo(
    () => plannedDayCompletionWeights(plannedForDay, selectedDay),
    [plannedForDay, selectedDay],
  )

  const dayDoneCount = useMemo(
    () =>
      plannedForDay.filter((t) => isPlannedTaskFullyCompleteForDay(t, selectedDay)).length,
    [plannedForDay, selectedDay],
  )

  const hiddenPlannedByFilterCount = useMemo(() => {
    const all = tasksScheduledForPlannerDay(vault.tasks, selectedDay)
    const visible = new Set(plannedForDay.map((t) => t.id))
    return all.filter((t) => !visible.has(t.id)).length
  }, [vault.tasks, selectedDay, plannedForDay])

  const hiddenWeekByFilterCount = useMemo(
    () => countHiddenByFilterInDays(vault.tasks, filteredVaultTasks, weekDays),
    [vault.tasks, filteredVaultTasks, weekDays],
  )

  const hiddenMonthByFilterCount = useMemo(
    () => countHiddenByFilterInDays(vault.tasks, filteredVaultTasks, monthDayKeysForPlan),
    [vault.tasks, filteredVaultTasks, monthDayKeysForPlan],
  )

  const weekOverdueCount = useMemo(
    () => countOverdueInDays(filteredVaultTasks, weekDays, todayKeyApp),
    [filteredVaultTasks, weekDays, todayKeyApp],
  )

  const monthOverdueCount = useMemo(
    () => countOverdueInDays(filteredVaultTasks, monthDayKeysForPlan, todayKeyApp),
    [filteredVaultTasks, monthDayKeysForPlan, todayKeyApp],
  )

  const monthDaySummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof summarizePlannerDay>> = {}
    for (const key of monthDayKeysForPlan) {
      map[key] = summarizePlannerDay(filteredVaultTasks, key, todayKeyApp)
    }
    return map
  }, [filteredVaultTasks, monthDayKeysForPlan, todayKeyApp])

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const g of vault.groups) m.set(g.id, g.name)
    return m
  }, [vault.groups])

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
    if (!window.confirm(t('settings.signOutConfirm'))) return
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
      className={DRAFT_LIST_ITEM}
    >
      <span className="min-w-0 flex-1 truncate text-on-surface">
        {d.title.trim() ? d.title : t('app.draftUntitled')}
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-primary/50 px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-40"
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
          className="rounded-lg border border-surface-variant px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
          onClick={() => void deleteDraft(d.id)}
        >
          {t('common.delete')}
        </button>
      </div>
    </li>
  ))

  const plannerHeaderActions = (
    <>
      <button
        type="button"
        className={`rounded p-2 transition-colors active:scale-95 ${
          remoteError
            ? 'text-error hover:bg-error-container/30'
            : savePending
              ? 'text-on-surface-variant hover:bg-surface-container'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
        }`}
        title={syncHint}
        aria-label={t('app.syncIconAria')}
      >
        <span className="sr-only">{syncHint}</span>
        <MaterialIcon
          name={savePending ? 'progress_activity' : remoteError ? 'cloud_off' : 'cloud_done'}
          size={22}
          className={savePending ? 'animate-spin' : undefined}
        />
      </button>
      <div className="relative" ref={accountMenuRef}>
        <button
          type="button"
          className="rounded p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface active:scale-95"
          aria-expanded={accountMenuOpen}
          aria-haspopup="menu"
          onClick={() => setAccountMenuOpen((v) => !v)}
        >
          <span className="sr-only">{t('app.accountMenuAria')}</span>
          <MaterialIcon name="account_circle" size={24} />
        </button>
        {accountMenuOpen ? (
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-surface-variant bg-surface-container-low py-1 shadow-xl"
            role="menu"
          >
            <div
              className="border-b border-surface-variant px-3 py-2 text-xs text-on-surface-variant"
              role="presentation"
            >
              {t('app.accountMenuRoleLine', { role: accountRoleLabel })}
            </div>
            <Link
              to="/app/reports"
              role="menuitem"
              className="block px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high"
              onClick={() => setAccountMenuOpen(false)}
            >
              {t('app.reportsNav')}
            </Link>
            {eodEnabled ? (
              <button
                type="button"
                role="menuitem"
                disabled={!canEdit}
                className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high disabled:opacity-40"
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
              className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
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
              className="block px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high"
              onClick={() => setAccountMenuOpen(false)}
            >
              {t('app.settings')}
            </Link>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-on-surface-variant hover:bg-surface-container-high"
              onClick={() => void handleSignOut()}
            >
              {t('settings.signOut')}
            </button>
          </div>
        ) : null}
      </div>
    </>
  )

  return (
    <MotivatorShell
      activeNav="planner"
      wide
      title={t('app.plannerTitle')}
      headerActions={plannerHeaderActions}
    >
      <div className="relative flex min-h-0 flex-col">
      {!remoteHydrated && !decryptFailed ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/90 px-6 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="app-sync-blocking-title"
          aria-describedby="app-sync-blocking-desc"
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
            aria-hidden
          />
          <p id="app-sync-blocking-title" className="max-w-sm text-center text-base font-medium text-on-surface">
            {t('app.syncBlockingTitle')}
          </p>
          <p id="app-sync-blocking-desc" className="max-w-sm text-center text-sm text-on-surface-variant">
            {remoteError ? humanizeConnectivityError(remoteError, t) : t('app.syncBlockingHint')}
          </p>
          {remoteError ? (
            <button
              type="button"
              className="rounded-lg border border-amber-600/70 bg-amber-950/50 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/40"
              onClick={() => retryRemoteHydrate()}
            >
              {t('app.syncRetry')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 border-b border-surface-variant pb-3 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label={t('app.viewNavAria')} className="min-w-0 flex-1 overflow-visible lg:max-w-md">
        <div className={VIEW_TABLIST} role="tablist">
          {(['day', 'week', 'month'] as const).map((v) => {
            const active = view === v
            const label =
              v === 'day' ? t('app.viewDay') : v === 'week' ? t('app.viewWeek') : t('app.viewMonth')
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active}
                className={viewTab(active)}
                onClick={() => handleTab(v)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </nav>
      <button
        type="button"
        className={`${PLANNER_NAV_BTN} inline-flex shrink-0 items-center justify-center`}
        aria-pressed={!chartsHidden}
        aria-label={chartsHidden ? t('app.chartsShow') : t('app.chartsHide')}
        title={chartsHidden ? t('app.chartsShow') : t('app.chartsHide')}
        onClick={() => {
          setChartsHidden((prev) => {
            const next = !prev
            writePlannerChartsHidden(next)
            return next
          })
        }}
      >
        <PlannerChartsIcon chartsHidden={chartsHidden} />
      </button>
      </div>
      {view === 'day' ? <AiCommandStub /> : null}

      {decryptFailed ? <VaultDecryptHelp className="mb-4" /> : null}

      {remoteHydrated && remoteError && !decryptFailed ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          <div className="min-w-0 flex-1 leading-snug">
            <p>{humanizeConnectivityError(remoteError, t)}</p>
            {isLikelyNetworkFetchFailure(remoteError) ? (
              <p className="mt-1 text-xs text-amber-200/85">{t('app.syncErrorRegionalHint')}</p>
            ) : null}
          </div>
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
        <div className="scrollbar-site flex flex-nowrap items-center gap-1.5 overflow-x-auto">
          <div className="relative shrink-0">
            <button
              type="button"
              disabled={!canEdit}
              aria-expanded={filtersPanelOpen}
              className={`${SETTINGS_BTN_SECONDARY} inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 pr-4 sm:gap-2 sm:px-4 sm:py-2 sm:pr-5`}
              onClick={() => setFiltersPanelOpen((v) => !v)}
            >
              {t('app.filterToggle')}
              <span className="text-on-surface-variant" aria-hidden>
                {filtersPanelOpen ? '▴' : '▾'}
              </span>
            </button>
          </div>
          {view === 'day' && eodEnabled ? (
            selectedDay > todayKeyApp ? null : selectedDay < todayKeyApp ? (
              <button
                type="button"
                disabled={!canEdit}
                className="btn-secondary shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs disabled:opacity-40 sm:px-3 sm:py-2 sm:text-sm"
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
                className={`shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-40 sm:px-3 sm:py-2 sm:text-sm ${
                  eodDoneToday
                    ? 'border-primary/50 text-primary hover:bg-primary/10'
                    : 'border-secondary/50 text-secondary hover:bg-secondary/10'
                }`}
                onClick={() =>
                  setEodModalContext({ dateKey: todayKeyApp, mode: 'ritual' })
                }
              >
                {eodDoneToday ? t('app.eodNavSummary') : t('app.eodNav')}
              </button>
            )
          ) : null}
          <div className={cn('relative shrink-0', view === 'day' && 'max-md:hidden')}>
            <button
              type="button"
              disabled={!canEdit}
              className="btn-primary inline-flex shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs disabled:opacity-40 sm:px-4 sm:py-2 sm:text-sm"
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
              <div className={FILTER_PANEL}>
                <div className="flex shrink-0 items-center justify-between border-b border-surface-variant px-4 py-3 md:hidden">
                  <span className="font-display text-sm font-medium text-on-surface">{t('app.filtersTitle')}</span>
                  <button
                    type="button"
                    className={SETTINGS_BTN_SECONDARY}
                    onClick={() => setFiltersPanelOpen(false)}
                  >
                    {t('app.filtersSheetDone')}
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 md:overflow-visible md:p-0">
                  <p className="mb-3 hidden font-display text-xs font-medium text-on-surface-variant md:block">
                    {t('app.filtersTitle')}
                  </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className={`flex min-w-[10rem] flex-col gap-1 ${SETTINGS_LABEL}`}>
                <span>{t('app.group')}</span>
                <select
                  className={`${MOTIVATOR_INPUT} disabled:opacity-50`}
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

              <div className={`flex min-w-[11rem] flex-col gap-1 ${SETTINGS_LABEL}`}>
                <span>{t('app.filterPriorities')}</span>
                <div className="relative" ref={priorityMenuRef}>
                  <button
                    type="button"
                    disabled={!canEdit}
                    aria-expanded={openFilterMenu === 'priorities'}
                    className={`${MOTIVATOR_INPUT} flex w-full cursor-pointer list-none items-center justify-between gap-2 text-left disabled:opacity-50`}
                    onClick={() =>
                      setOpenFilterMenu((v) => (v === 'priorities' ? null : 'priorities'))
                    }
                  >
                    <span className="min-w-0 flex-1 truncate">{priorityFilterSummary}</span>
                    <span className="shrink-0 text-on-surface-variant" aria-hidden>
                      ▾
                    </span>
                  </button>
                  {openFilterMenu === 'priorities' ? (
                    <div
                      className="absolute left-0 top-full z-30 mt-1 min-w-[14rem] rounded-xl border border-surface-variant bg-surface-container-lowest p-2 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                        {priorityRanksForFilterMenu.map((r) => (
                          <label
                            key={r}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface hover:bg-surface-container"
                          >
                            <input
                              type="checkbox"
                              checked={priorityEnabled.has(r)}
                              disabled={!canEdit}
                              onChange={() => togglePriority(r)}
                              className="h-3.5 w-3.5 shrink-0 rounded border-outline-variant bg-surface-container-low text-primary disabled:opacity-40"
                            />
                            <span>{vault.priorityLabels[r]}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={!canEdit}
                        className="btn-secondary mt-2 w-full px-2 py-1.5 text-xs disabled:opacity-40"
                        onClick={() => selectAllPriorities()}
                      >
                        {t('app.filterPrioritiesAllShort')}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <label className={`flex min-w-[10rem] flex-col gap-1 ${SETTINGS_LABEL}`}>
                <span>{t('app.filterColor')}</span>
                <select
                  className={`${MOTIVATOR_INPUT} disabled:opacity-50`}
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

              <label className={`flex min-w-[10rem] flex-col gap-1 ${SETTINGS_LABEL}`}>
                <span>{t('app.filterRepeats')}</span>
                <select
                  className={`${MOTIVATOR_INPUT} disabled:opacity-50`}
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
              <span key={c.key} className={FILTER_CHIP}>
                <span className="min-w-0 truncate">{c.label}</span>
                <button
                  type="button"
                  className={FILTER_CHIP_DISMISS}
                  onClick={c.onRemove}
                  aria-label={t('common.close')}
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" className={FILTER_CHIP_RESET} onClick={resetAllFilters}>
              {t('app.filtersResetAll')}
            </button>
          </div>
        ) : null}

        {view === 'day' && hiddenPlannedByFilterCount > 0 ? (
          <p className="mb-3 text-label-sm text-on-surface-variant" role="status">
            {t('app.filtersHiddenCount', { count: hiddenPlannedByFilterCount })}
          </p>
        ) : null}

        {view === 'week' && hiddenWeekByFilterCount > 0 ? (
          <p className="mb-3 text-label-sm text-on-surface-variant" role="status">
            {t('app.filtersHiddenCount', { count: hiddenWeekByFilterCount })}
          </p>
        ) : null}

        {view === 'month' && hiddenMonthByFilterCount > 0 ? (
          <p className="mb-3 text-label-sm text-on-surface-variant" role="status">
            {t('app.filtersHiddenCount', { count: hiddenMonthByFilterCount })}
          </p>
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
              className={MODAL_SHELL}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={MODAL_HEADER}>
                <h2 id="drafts-modal-title" className="font-display text-sm font-semibold text-amber-300">
                  {t('app.draftsTitle')}
                </h2>
                <button
                  type="button"
                  className={`rounded-lg px-2 py-1 ${MODAL_CLOSE_BTN}`}
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
          <PlannerPeriodNav
            canEdit={canEdit}
            dateLabel={formatDayHeading(selectedDay, locale)}
            onPrev={() => setSelectedDay(shiftLocalDateKey(selectedDay, -1))}
            onNext={() => setSelectedDay(shiftLocalDateKey(selectedDay, 1))}
            onJumpToCurrent={() => setSelectedDay(localDateKey())}
            prevAriaLabel={t('app.dayPrev')}
            nextAriaLabel={t('app.dayNext')}
            jumpLabel={t('app.today')}
          />

          <DayPlannerStatsRow
            progress={dayPlanProgress}
            doneCount={dayDoneCount}
            eodEnabled={eodEnabled}
            eodClosedForDay={eodClosedForSelectedDay}
            selectedDay={selectedDay}
            todayKey={todayKeyApp}
          />

          <section className="mb-8">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className={cn(PLANNER_SECTION_HEAD, 'mb-0')}>{t('app.sectionPlanned')}</h2>
              {plannedForDay.length > 0 ? (
                <span className="text-label-sm text-on-surface-variant">
                  {t('app.dayPlanCount', {
                    done: dayDoneCount,
                    total: plannedForDay.length,
                  })}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start lg:gap-10">
              <div className="min-w-0 w-full lg:max-w-lg lg:shrink-0">
                {plannedForDay.length === 0 ? (
                  <p className={EMPTY_STATE_BOX}>{t('app.emptyPlannedDay')}</p>
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
                          groupName={groupNameById.get(task.groupId) ?? null}
                          overdue={isPlannerTaskOverdue(task, selectedDay, todayKeyApp)}
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
              {!chartsHidden ? (
                <div className="flex w-full min-w-0 flex-1 justify-center lg:min-h-[1px] lg:justify-center lg:pt-0.5">
                  <DayPlanDonut plannedTasksForDay={plannedForDay} dayKey={selectedDay} />
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <h2 className={PLANNER_SECTION_HEAD}>{t('app.sectionBacklog')}</h2>
            {backlogTasks.length === 0 ? (
              <p className={`${EMPTY_STATE_BOX} py-6`}>{t('app.emptyBacklog')}</p>
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

          <PlannerCreateFab
            disabled={!canEdit}
            ariaLabel={t('app.openCreateTask')}
            onClick={() => {
              setResumeDraft(null)
              setCreateOpen(true)
            }}
          />
        </>
      )}

      {view === 'week' && (
        <section className="flex min-h-0 flex-1 flex-col space-y-3">
          <PlannerPeriodNav
            canEdit={canEdit}
            className=""
            dateLabel={formatWeekRangeCompact(weekDays[0], weekDays[6], locale)}
            onPrev={() => setWeekStartMonday((w) => shiftWeekStartMonday(w, -1))}
            onNext={() => setWeekStartMonday((w) => shiftWeekStartMonday(w, 1))}
            onJumpToCurrent={() => setWeekStartMonday(startOfWeekMonday(localDateKey()))}
            prevAriaLabel={t('app.weekPrev')}
            nextAriaLabel={t('app.weekNext')}
            jumpLabel={t('app.weekThis')}
          />
          <PeriodPlannerStatsRow
            mode="week"
            progress={weekPlanProgress}
            periodLabel={formatWeekRangeCompact(weekDays[0], weekDays[6], locale)}
            overdueCount={weekOverdueCount}
          />
          <div className="mx-auto flex min-h-0 w-full max-w-desktop flex-1 flex-col-reverse gap-4 xl:flex-row xl:items-stretch xl:justify-between xl:gap-8">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <WeekGrid
                weekDays={weekDays}
                tasks={filteredVaultTasks}
                todayKey={todayKeyApp}
                priorityLabels={vault.priorityLabels}
                locale={locale}
                canEdit={canEdit}
                onTaskClick={(id, day) => openTaskEditor(id, day)}
              />
            </div>
            {weekPlanProgress.plannedTaskCount > 0 && !chartsHidden ? (
              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 xl:w-[min(100%,320px)] xl:pt-1">
                <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-2">
                  <div className="flex min-h-0 min-w-0 flex-1 justify-center lg:justify-center">
                    <PeriodPlanDonut
                      progress={weekPlanProgress}
                      title={t('app.periodPlanWeekRingTitle')}
                      subtitle={formatWeekRangeCompact(weekDays[0], weekDays[6], locale)}
                      ringSize={weekPlanUiWide ? 120 : 92}
                      ringStroke={weekPlanUiWide ? 10 : 8}
                    />
                  </div>
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 lg:w-full">
                    <PeriodPlanBreakdownChart
                      compact={!weekPlanUiWide}
                      rows={weekBreakdownChartRows}
                      title={
                        periodSlotsMode === 'group'
                          ? t('app.periodBreakdownChartTitleGroup')
                          : t('app.periodBreakdownChartTitleColor')
                      }
                    />
                    <div className="flex flex-wrap justify-center gap-1">
                      <button
                        type="button"
                        className={periodBreakdownToggle(periodSlotsMode === 'group')}
                        onClick={() => setPeriodSlotsMode('group')}
                      >
                        {t('app.periodBreakdownByGroup')}
                      </button>
                      <button
                        type="button"
                        className={periodBreakdownToggle(periodSlotsMode === 'color')}
                        onClick={() => setPeriodSlotsMode('color')}
                      >
                        {t('app.periodBreakdownByColor')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {view === 'month' && (
        <section className="space-y-4">
          <PlannerPeriodNav
            canEdit={canEdit}
            className=""
            dateLabel={monthLabel(monthYear, monthIndex, locale)}
            onPrev={() => {
              const d = new Date(monthYear, monthIndex - 1, 1)
              setMonthYear(d.getFullYear())
              setMonthIndex(d.getMonth())
            }}
            onNext={() => {
              const d = new Date(monthYear, monthIndex + 1, 1)
              setMonthYear(d.getFullYear())
              setMonthIndex(d.getMonth())
            }}
            onJumpToCurrent={() => {
              const now = parseLocalDateKey(localDateKey())!
              setMonthYear(now.getFullYear())
              setMonthIndex(now.getMonth())
            }}
            prevAriaLabel={t('app.monthPrev')}
            nextAriaLabel={t('app.monthNext')}
            jumpLabel={t('app.monthThis')}
          />
          <PeriodPlannerStatsRow
            mode="month"
            progress={monthPlanProgress}
            periodLabel={monthLabel(monthYear, monthIndex, locale)}
            overdueCount={monthOverdueCount}
          />
          <div className="mx-auto flex w-full max-w-desktop flex-col-reverse items-stretch gap-6 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
            <div className="mx-auto w-full min-w-0 flex-1 xl:mx-0 xl:max-w-2xl">
              <MonthCalendar
                matrix={monthMatrix}
                daySummaries={monthDaySummaries}
                todayKey={todayKeyApp}
                locale={locale}
                canEdit={canEdit}
                onPickDay={(dateKey) => {
                  setSelectedDay(dateKey)
                  setView('day')
                }}
              />
            </div>
            {monthPlanProgress.plannedTaskCount > 0 && !chartsHidden ? (
              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 xl:w-[min(100%,320px)] xl:justify-end xl:pt-1">
                <PeriodPlanDonut
                  progress={monthPlanProgress}
                  title={t('app.periodPlanMonthRingTitle')}
                  subtitle={monthLabel(monthYear, monthIndex, locale)}
                />
                <PeriodPlanBreakdownChart
                  rows={monthBreakdownChartRows}
                  title={
                    periodSlotsMode === 'group'
                      ? t('app.periodBreakdownChartTitleGroup')
                      : t('app.periodBreakdownChartTitleColor')
                  }
                />
                <div className="flex flex-wrap justify-center gap-1">
                  <button
                    type="button"
                    className={periodBreakdownToggle(periodSlotsMode === 'group')}
                    onClick={() => setPeriodSlotsMode('group')}
                  >
                    {t('app.periodBreakdownByGroup')}
                  </button>
                  <button
                    type="button"
                    className={periodBreakdownToggle(periodSlotsMode === 'color')}
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
          onSkipOccurrenceForDay={
            editingTask.recurrence
              ? (dayKey) => void skipTaskOccurrenceForDay(editingTask.id, dayKey)
              : undefined
          }
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
    </MotivatorShell>
  )
}

export function AppPage() {
  return (
    <RequireVault>
      <AppPageInner />
    </RequireVault>
  )
}
