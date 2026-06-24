import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalDatePickerField } from '@/components/LocalDatePickerField'
import {
  CHECKBOX_INPUT,
  FIELD_LABEL,
  FIELDSET,
  FIELDSET_LEGEND,
  ALERT_WARNING_BODY,
  ALERT_WARNING_MUTED,
  ALERT_WARNING_TITLE,
  MODAL_CLOSE_BTN,
  MODAL_FOOTER,
  MODAL_HEADER,
  MODAL_SHELL,
  TASK_PANEL_OVERLAY_SIDEBAR,
  TASK_PANEL_SHELL_SIDEBAR,
  MODAL_TITLE,
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
  TEXT_HINT_WARNING,
  weekdayToggle,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import { useDialogFocusTrap } from '@/lib/useDialogFocusTrap'
import { TaskColorAccordion } from '@/components/TaskColorAccordion'
import { TaskTimeAccordion } from '@/components/TaskTimeAccordion'
import {
  DEFAULT_GROUP_ID,
  PRIORITY_RANKS,
  TASK_COLOR_HEX,
  mergeEstimateParts,
  minutesToTimeInput,
  nearestTaskColorKey,
  parseColorInput,
  splitEstimateMinutes,
  timeInputToMinutes,
  type CreateTaskInput,
  type PriorityLabels,
  type RecurrenceRule,
  type TaskColorKey,
  type TaskDraft,
  type TaskGroup,
  type TaskTimeMode,
} from '@motivator/core'
import {
  MAX_TASK_TITLE_CHARS,
  normalizeEstimatePair,
  reconcileEstimateAfterHoursEdit,
  reconcileEstimateAfterMinutesEdit,
  sanitizeEveryNDaysInput,
  sanitizeTaskTitleInput,
} from '@/lib/fieldSanitize'
import {
  computeFloatingEstimateDayWarning,
  computeRecurrenceAnchorPastError,
  computeTaskScheduleValidationError,
  type TaskScheduleValidationFields,
} from '@/lib/taskScheduleValidation'
import { appLocalDateKey, getAppNow } from '@/lib/appNow'

type RecurrenceUiKind = 'none' | 'daily' | 'everyNDays' | 'weekly'

/** Плановая дата не раньше локального сегодня (строки YYYY-MM-DD). */
function clampPlanDateKey(dateKey: string): string {
  const today = appLocalDateKey()
  return dateKey < today ? today : dateKey
}

type Snapshot = {
  title: string
  groupId: string
  colorKey: TaskColorKey
  /** Поле ввода HEX / отображение для пипетки */
  colorHexInput: string
  priorityRank: number
  backlogOnly: boolean
  scheduledLocalDate: string | null
  estimatedHours: string
  estimatedMinutesPart: string
  timeMode: TaskTimeMode
  timeClock: string
  recurrenceKind: RecurrenceUiKind
  everyNDays: number
  weekdays: number[]
  anchorLocalDate: string
  /** DR-004: двойное подтверждение при отметке выполнено */
  doubleConfirmEnabled: boolean
}

function snapshotFromDraft(d: TaskDraft, fallbackDay: string): Snapshot {
  let recurrenceKind: RecurrenceUiKind = 'none'
  if (d.recurrence?.kind === 'daily') recurrenceKind = 'daily'
  else if (d.recurrence?.kind === 'everyNDays') recurrenceKind = 'everyNDays'
  else if (d.recurrence?.kind === 'weekly') recurrenceKind = 'weekly'

  return {
    title: d.title,
    groupId: d.groupId,
    colorKey: d.colorKey,
    colorHexInput: TASK_COLOR_HEX[d.colorKey] ?? TASK_COLOR_HEX.zinc,
    priorityRank: d.priorityRank,
    backlogOnly: d.scheduledLocalDate === null,
    scheduledLocalDate:
      d.scheduledLocalDate == null ? null : clampPlanDateKey(d.scheduledLocalDate),
    ...(() => {
      const p = splitEstimateMinutes(d.estimatedMinutes)
      return {
        estimatedHours: p.hours,
        estimatedMinutesPart: p.minutes,
      }
    })(),
    timeMode: d.timeMode,
    timeClock:
      d.timeMinutesFromMidnight != null ? minutesToTimeInput(d.timeMinutesFromMidnight) : '',
    recurrenceKind,
    everyNDays: d.recurrence?.kind === 'everyNDays' ? d.recurrence.n : 2,
    weekdays: d.recurrence?.kind === 'weekly' ? [...d.recurrence.weekdays] : [],
    anchorLocalDate: clampPlanDateKey(
      d.recurrenceAnchorLocalDate ?? d.scheduledLocalDate ?? fallbackDay,
    ),
    doubleConfirmEnabled: false,
  }
}

function emptySnapshot(selectedDayKey: string, groupId: string): Snapshot {
  const plan = clampPlanDateKey(selectedDayKey)
  return {
    title: '',
    groupId,
    colorKey: 'zinc',
    colorHexInput: TASK_COLOR_HEX.zinc,
    priorityRank: 3,
    backlogOnly: false,
    scheduledLocalDate: plan,
    estimatedHours: '',
    estimatedMinutesPart: '',
    timeMode: 'none',
    timeClock: '',
    recurrenceKind: 'none',
    everyNDays: 2,
    weekdays: [],
    anchorLocalDate: plan,
    doubleConfirmEnabled: false,
  }
}

function buildRecurrenceRule(
  kind: RecurrenceUiKind,
  everyNDays: number,
  weekdays: number[],
): RecurrenceRule | null {
  if (kind === 'none') return null
  if (kind === 'daily') return { kind: 'daily' }
  if (kind === 'everyNDays') return { kind: 'everyNDays', n: Math.max(1, Math.floor(everyNDays)) }
  if (kind === 'weekly') {
    const wd = [...new Set(weekdays.filter((x) => x >= 0 && x <= 6))].sort((a, b) => a - b)
    if (wd.length === 0) return null
    return { kind: 'weekly', weekdays: wd }
  }
  return null
}

function toggleWeekday(set: number[], d: number): number[] {
  const has = set.includes(d)
  if (has) return set.filter((x) => x !== d)
  return [...set, d].sort((a, b) => a - b)
}

/**
 * Каноническое представление формы для флага «были изменения»:
 * без лишней грязи от пробелов, HEX vs палитра, порядка дней недели.
 */
function snapshotCanonical(s: Snapshot, selectedDayKey: string): string {
  const est = normalizeEstimatePair(s.estimatedHours, s.estimatedMinutesPart)
  return JSON.stringify({
    title: s.title.trim(),
    groupId: s.groupId,
    colorKey: s.colorKey,
    priorityRank: s.priorityRank,
    backlogOnly: s.backlogOnly,
    scheduledLocalDate: s.scheduledLocalDate,
    estimatedHours: est.hours,
    estimatedMinutesPart: est.minutes,
    timeMode: s.timeMode,
    timeClock: s.timeMode === 'none' ? '' : s.timeClock,
    recurrenceKind: s.recurrenceKind,
    everyNDays: s.everyNDays,
    weekdays: [...s.weekdays].sort((a, b) => a - b),
    anchorLocalDate: s.anchorLocalDate.trim() || selectedDayKey,
    doubleConfirmEnabled: s.doubleConfirmEnabled,
  })
}

function resolveCreateRecurrenceAnchor(
  snap: Snapshot,
  selectedDayKey: string,
): { recurrenceFinal: RecurrenceRule | null; anchorOut: string | null } {
  const recurrence = buildRecurrenceRule(snap.recurrenceKind, snap.everyNDays, snap.weekdays)
  let anchor = snap.anchorLocalDate.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) anchor = selectedDayKey
  const scheduled = snap.backlogOnly ? null : snap.scheduledLocalDate
  let anchorOut: string | null = recurrence ? anchor : null
  if (recurrence && !anchorOut) anchorOut = scheduled ?? selectedDayKey
  const recurrenceFinal = recurrence && anchorOut ? recurrence : null
  return { recurrenceFinal, anchorOut }
}

export type CreateTaskModalProps = {
  open: boolean
  selectedDayKey: string
  resumeDraft: TaskDraft | null
  groups: TaskGroup[]
  priorityLabels: PriorityLabels
  defaultGroupId: string
  canEdit: boolean
  onClose: () => void
  onSave: (input: CreateTaskInput, opts: { removeDraftId?: string }) => Promise<void>
  onPersistDraft: (draft: TaskDraft) => Promise<void>
  /** 'modal' (центр, по умолчанию) или 'sidebar' — правый сайдбар / bottom-sheet (Phase 13). */
  presentation?: 'modal' | 'sidebar'
  /** Минуты от полуночи для префилла времени при «+Add» из пустого слота недели (Phase 13). */
  initialStartMinutes?: number | null
}

export function CreateTaskModal({
  open,
  selectedDayKey,
  resumeDraft,
  groups,
  priorityLabels,
  defaultGroupId,
  canEdit,
  onClose,
  onSave,
  onPersistDraft,
  presentation = 'modal',
  initialStartMinutes = null,
}: CreateTaskModalProps) {
  const { t } = useTranslation()
  const savedRef = useRef(false)
  const initialRef = useRef<Snapshot | null>(null)
  const draftIdRef = useRef<string | null>(null)
  /** Чтобы не сбрасывать черновик формы при смене дня/фильтра, пока модалка уже открыта. */
  const wasModalOpenRef = useRef(false)

  const [snap, setSnap] = useState<Snapshot>(() =>
    emptySnapshot(selectedDayKey, defaultGroupId),
  )
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [saveAttempted, setSaveAttempted] = useState(false)
  /** Обновление нижней границы времени для «сегодня» раз в минуту, пока открыта модалка. */
  const [todayTimeFloorTick, setTodayTimeFloorTick] = useState(0)
  const titleRef = useRef<HTMLDivElement>(null)
  const scheduleRef = useRef<HTMLFieldSetElement>(null)
  const estimateRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)
  const recurrenceRef = useRef<HTMLFieldSetElement>(null)
  const additionalSettingsRef = useRef<HTMLDetailsElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeConfirmRef = useRef<HTMLDivElement>(null)

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups])

  useDialogFocusTrap(open && !closeConfirmOpen, dialogRef)
  useDialogFocusTrap(closeConfirmOpen, closeConfirmRef)

  useEffect(() => {
    if (!open) {
      wasModalOpenRef.current = false
      return
    }

    const justOpened = !wasModalOpenRef.current
    wasModalOpenRef.current = true
    if (!justOpened) return

    savedRef.current = false
    setCloseConfirmOpen(false)
    setSaveAttempted(false)
    draftIdRef.current = resumeDraft?.id ?? null
    const base = resumeDraft
      ? snapshotFromDraft(resumeDraft, selectedDayKey)
      : emptySnapshot(selectedDayKey, defaultGroupId)
    // Префилл времени из «+Add» по пустому слоту недели (только для нового, не для черновика).
    if (!resumeDraft && initialStartMinutes != null) {
      base.timeMode = 'start'
      base.timeClock = minutesToTimeInput(initialStartMinutes)
    }
    initialRef.current = JSON.parse(JSON.stringify(base)) as Snapshot
    setSnap(base)
  }, [open, resumeDraft, selectedDayKey, defaultGroupId, initialStartMinutes])

  const isDirty = useMemo(() => {
    const init = initialRef.current
    if (!init) return false
    return snapshotCanonical(snap, selectedDayKey) !== snapshotCanonical(init, selectedDayKey)
  }, [snap, selectedDayKey])

  const plannedWithEstimateRequired = useMemo(
    () => !snap.backlogOnly && snap.scheduledLocalDate != null,
    [snap.backlogOnly, snap.scheduledLocalDate],
  )

  const planDateIsToday = useMemo(
    () =>
      Boolean(
        open &&
          !snap.backlogOnly &&
          snap.scheduledLocalDate &&
          snap.scheduledLocalDate === appLocalDateKey(),
      ),
    [open, snap.backlogOnly, snap.scheduledLocalDate],
  )

  useEffect(() => {
    if (!planDateIsToday) return
    const id = window.setInterval(() => setTodayTimeFloorTick((x) => x + 1), 60_000)
    return () => clearInterval(id)
  }, [planDateIsToday])

  const earliestClockMinutesFromMidnight = useMemo(() => {
    void todayTimeFloorTick
    if (!planDateIsToday) return null
    const n = getAppNow()
    return n.getHours() * 60 + n.getMinutes()
  }, [planDateIsToday, todayTimeFloorTick])

  useEffect(() => {
    if (!open || !planDateIsToday || snap.timeMode === 'none') return
    const floor = getAppNow().getHours() * 60 + getAppNow().getMinutes()
    const m = timeInputToMinutes(snap.timeClock.trim())
    if (m == null) return
    if (m < floor) {
      setSnap((s) => ({ ...s, timeClock: minutesToTimeInput(floor) }))
    }
  }, [
    open,
    planDateIsToday,
    snap.timeMode,
    snap.timeClock,
    snap.scheduledLocalDate,
    todayTimeFloorTick,
  ])

  const validationFields = useMemo(
    (): TaskScheduleValidationFields => ({
      backlogOnly: snap.backlogOnly,
      scheduledLocalDate: snap.scheduledLocalDate,
      timeMode: snap.timeMode,
      timeClock: snap.timeMode === 'none' ? '' : snap.timeClock,
      estimatedHours: snap.estimatedHours,
      estimatedMinutesPart: snap.estimatedMinutesPart,
      plannedWithEstimateRequired,
    }),
    [snap, plannedWithEstimateRequired],
  )

  const scheduleValidationError = useMemo(
    () => computeTaskScheduleValidationError(validationFields, t),
    [validationFields, t],
  )

  const { recurrenceFinal: recurrenceResolved, anchorOut: anchorResolved } = useMemo(
    () => resolveCreateRecurrenceAnchor(snap, selectedDayKey),
    [snap, selectedDayKey],
  )

  const anchorValidationError = useMemo(
    () =>
      computeRecurrenceAnchorPastError(anchorResolved, Boolean(recurrenceResolved), t),
    [anchorResolved, recurrenceResolved, t],
  )

  const floatingEstimateWarning = useMemo(
    () => computeFloatingEstimateDayWarning(validationFields, t),
    [validationFields, t],
  )

  const blockingLinesForSave = useMemo(() => {
    const lines: string[] = []
    if (!snap.title.trim()) lines.push(t('app.createTaskMissingTitle'))
    const estNorm = normalizeEstimatePair(snap.estimatedHours, snap.estimatedMinutesPart)
    const estMerge = mergeEstimateParts(estNorm.hours, estNorm.minutes)
    if (estMerge.invalid) {
      lines.push(t('app.estimateInvalid'))
    } else if (plannedWithEstimateRequired && estMerge.total == null) {
      lines.push(t('app.estimateRequiredWhenPlanned'))
    }
    if (scheduleValidationError) lines.push(scheduleValidationError)
    if (anchorValidationError) lines.push(anchorValidationError)
    return lines
  }, [
    snap.title,
    snap.estimatedHours,
    snap.estimatedMinutesPart,
    plannedWithEstimateRequired,
    scheduleValidationError,
    anchorValidationError,
    t,
  ])

  function parseTimeForSubmit(): { mode: TaskTimeMode; minutes: number | null } {
    if (snap.timeMode === 'none') return { mode: 'none', minutes: null }
    let m = timeInputToMinutes(snap.timeClock)
    if (m == null) m = 9 * 60
    if (planDateIsToday) {
      const floor = getAppNow().getHours() * 60 + getAppNow().getMinutes()
      if (m < floor) m = floor
    }
    return { mode: snap.timeMode, minutes: m }
  }

  function scrollToRef(el: HTMLElement | null) {
    if (!el) return
    window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 0)
  }

  async function handleSave() {
    setSaveAttempted(true)
    const trimmed = snap.title.trim()
    if (!trimmed || !canEdit) {
      scrollToRef(titleRef.current)
      return
    }

    const estNorm = normalizeEstimatePair(snap.estimatedHours, snap.estimatedMinutesPart)
    const estMerge = mergeEstimateParts(estNorm.hours, estNorm.minutes)
    if (estMerge.invalid) {
      scrollToRef(estimateRef.current)
      return
    }
    if (plannedWithEstimateRequired && estMerge.total == null) {
      scrollToRef(estimateRef.current)
      return
    }

    const schedErr = computeTaskScheduleValidationError(validationFields, t)
    if (schedErr) {
      const low = schedErr.toLowerCase()
      if (
        low.includes('время') ||
        low.includes('time') ||
        low.includes('начала') ||
        low.includes('окончания') ||
        low.includes('clock')
      ) {
        scrollToRef(timeRef.current)
      } else {
        scrollToRef(scheduleRef.current)
      }
      return
    }

    const { recurrenceFinal, anchorOut } = resolveCreateRecurrenceAnchor(snap, selectedDayKey)
    const anchorErr = computeRecurrenceAnchorPastError(anchorOut, Boolean(recurrenceFinal), t)
    if (anchorErr) {
      scrollToRef(recurrenceRef.current)
      return
    }

    const scheduled = snap.backlogOnly ? null : snap.scheduledLocalDate

    const tm = parseTimeForSubmit()
    const input: CreateTaskInput = {
      title: trimmed,
      groupId: sortedGroups.some((g) => g.id === snap.groupId) ? snap.groupId : DEFAULT_GROUP_ID,
      colorKey: snap.colorKey,
      priorityRank: PRIORITY_RANKS.includes(snap.priorityRank as (typeof PRIORITY_RANKS)[number])
        ? (snap.priorityRank as CreateTaskInput['priorityRank'])
        : 3,
      scheduledLocalDate: scheduled,
      estimatedMinutes: estMerge.total,
      timeMode: tm.mode,
      timeMinutesFromMidnight: tm.minutes,
      recurrence: recurrenceFinal,
      recurrenceAnchorLocalDate: recurrenceFinal ? anchorOut : null,
      ...(snap.doubleConfirmEnabled ? { doubleConfirmEnabled: true } : {}),
    }

    savedRef.current = true
    await onSave(input, { removeDraftId: draftIdRef.current ?? undefined })
    onClose()
  }

  const handleAttemptClose = useCallback(() => {
    if (savedRef.current) {
      onClose()
      return
    }
    if (!isDirty || !canEdit) {
      onClose()
      return
    }
    setCloseConfirmOpen(true)
  }, [onClose, isDirty, canEdit])

  const finalizeDismissWithoutSave = useCallback(async () => {
    setCloseConfirmOpen(false)
    if (savedRef.current) {
      onClose()
      return
    }
    if (isDirty && canEdit) {
      const scheduled = snap.backlogOnly ? null : snap.scheduledLocalDate
      const { recurrenceFinal, anchorOut } = resolveCreateRecurrenceAnchor(snap, selectedDayKey)

      const tm = parseTimeForSubmit()
      const estNorm = normalizeEstimatePair(snap.estimatedHours, snap.estimatedMinutesPart)
      const draftEst = mergeEstimateParts(estNorm.hours, estNorm.minutes)
      const draft: TaskDraft = {
        id: draftIdRef.current ?? crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
        title: snap.title,
        groupId: sortedGroups.some((g) => g.id === snap.groupId) ? snap.groupId : DEFAULT_GROUP_ID,
        colorKey: snap.colorKey,
        priorityRank: PRIORITY_RANKS.includes(snap.priorityRank as (typeof PRIORITY_RANKS)[number])
          ? (snap.priorityRank as TaskDraft['priorityRank'])
          : 3,
        scheduledLocalDate: scheduled,
        estimatedMinutes: draftEst.invalid ? null : draftEst.total,
        timeMode: tm.mode,
        timeMinutesFromMidnight: tm.minutes,
        recurrence: recurrenceFinal,
        recurrenceAnchorLocalDate: recurrenceFinal ? anchorOut : null,
      }
      await onPersistDraft(draft)
    }
    onClose()
  }, [
    isDirty,
    canEdit,
    snap,
    selectedDayKey,
    sortedGroups,
    onClose,
    onPersistDraft,
  ])

  const closeConfirmHint = !isDirty
    ? t('app.createTaskCloseHintPristine')
    : canEdit
      ? t('app.createTaskCloseHintDraft')
      : t('app.createTaskCloseHintLost')

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      if (closeConfirmOpen) {
        setCloseConfirmOpen(false)
        return
      }
      handleAttemptClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closeConfirmOpen, handleAttemptClose])

  if (!open) return null

  const weekdayButtons = [
    { d: 1, label: t('app.weekdayMon') },
    { d: 2, label: t('app.weekdayTue') },
    { d: 3, label: t('app.weekdayWed') },
    { d: 4, label: t('app.weekdayThu') },
    { d: 5, label: t('app.weekdayFri') },
    { d: 6, label: t('app.weekdaySat') },
    { d: 0, label: t('app.weekdaySun') },
  ]

  return (
    <>
      <div
        className={
          presentation === 'sidebar'
            ? TASK_PANEL_OVERLAY_SIDEBAR
            : 'fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center'
        }
        role="presentation"
        aria-hidden={closeConfirmOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleAttemptClose()
        }}
      >
      <div
        ref={dialogRef}
        className={presentation === 'sidebar' ? TASK_PANEL_SHELL_SIDEBAR : MODAL_SHELL}
        role="dialog"
        aria-modal
        aria-labelledby="create-task-modal-title"
      >
        <div className={MODAL_HEADER}>
          <h2 id="create-task-modal-title" className={MODAL_TITLE}>{t('app.createTaskTitle')}</h2>
          <button
            type="button"
            className={MODAL_CLOSE_BTN}
            aria-label={t('common.close')}
            onClick={() => handleAttemptClose()}
          >
            ✕
          </button>
        </div>

        <div className="scrollbar-site flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2 pt-3">
        <div ref={titleRef} className="scroll-mt-24">
        <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {t('app.taskTitle')}
              <span className="text-tertiary" aria-hidden>
                {' '}
                *
              </span>
            </span>
            <span className="font-normal text-on-surface-variant">
              {snap.title.length}/{MAX_TASK_TITLE_CHARS}
            </span>
          </span>
          <input
            className={MOTIVATOR_INPUT}
            value={snap.title}
            disabled={!canEdit}
            onChange={(e) =>
              setSnap((s) => ({ ...s, title: sanitizeTaskTitleInput(e.target.value) }))
            }
          />
        </label>
        </div>

        <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
          <span>{t('app.priorityShort')}</span>
          <select
            className={MOTIVATOR_INPUT}
            value={snap.priorityRank}
            disabled={!canEdit}
            onChange={(e) =>
              setSnap((s) => ({ ...s, priorityRank: Number(e.target.value) }))
            }
          >
            {PRIORITY_RANKS.map((r) => (
              <option key={r} value={r}>
                {priorityLabels[r]}
              </option>
            ))}
          </select>
        </label>

        <fieldset ref={scheduleRef} className={FIELDSET}>
          <legend className={FIELDSET_LEGEND}>{t('app.scheduleSection')}</legend>
          <div className="flex flex-col gap-3">
            {!snap.backlogOnly ? (
              <LocalDatePickerField
                label={t('app.plannedDate')}
                value={snap.scheduledLocalDate}
                minLocalDateKey={appLocalDateKey()}
                onChange={(v) =>
                  setSnap((s) => {
                    const plan = v == null ? null : clampPlanDateKey(v)
                    return {
                      ...s,
                      scheduledLocalDate: plan,
                      anchorLocalDate:
                        s.recurrenceKind !== 'none'
                          ? plan || s.anchorLocalDate
                          : s.anchorLocalDate,
                    }
                  })
                }
                disabled={!canEdit}
              />
            ) : null}
            <label className="flex cursor-pointer items-center gap-2.5 text-xs leading-snug text-on-surface-variant">
              <input
                type="checkbox"
                className={`mt-0.5 ${CHECKBOX_INPUT}`}
                checked={snap.backlogOnly}
                disabled={!canEdit}
                onChange={(e) =>
                  setSnap((s) => ({
                    ...s,
                    backlogOnly: e.target.checked,
                    scheduledLocalDate: e.target.checked ? null : clampPlanDateKey(selectedDayKey),
                  }))
                }
              />
              <span>{t('app.addToBacklog')}</span>
            </label>
          </div>
        </fieldset>

        <div ref={timeRef} className="scroll-mt-24">
          <TaskTimeAccordion
            timeMode={snap.timeMode}
            timeClock={snap.timeMode === 'none' ? '' : snap.timeClock}
            canEdit={canEdit}
            radioName="createtimemode"
            onModeNone={() => setSnap((s) => ({ ...s, timeMode: 'none', timeClock: '' }))}
            onModeStart={() =>
              setSnap((s) => {
                const today =
                  !s.backlogOnly &&
                  s.scheduledLocalDate != null &&
                  s.scheduledLocalDate === appLocalDateKey()
                let m = timeInputToMinutes((s.timeClock || '').trim()) ?? 9 * 60
                if (today) {
                  const floor = getAppNow().getHours() * 60 + getAppNow().getMinutes()
                  if (m < floor) m = floor
                }
                return { ...s, timeMode: 'start', timeClock: minutesToTimeInput(m) }
              })
            }
            onModeEnd={() =>
              setSnap((s) => {
                const today =
                  !s.backlogOnly &&
                  s.scheduledLocalDate != null &&
                  s.scheduledLocalDate === appLocalDateKey()
                let m = timeInputToMinutes((s.timeClock || '').trim()) ?? 18 * 60
                if (today) {
                  const floor = getAppNow().getHours() * 60 + getAppNow().getMinutes()
                  if (m < floor) m = floor
                }
                return { ...s, timeMode: 'end', timeClock: minutesToTimeInput(m) }
              })
            }
            onClockChange={(value) => setSnap((s) => ({ ...s, timeClock: value }))}
            earliestClockMinutesFromMidnight={earliestClockMinutesFromMidnight}
          />
        </div>

        <div ref={estimateRef} className="scroll-mt-24 flex flex-col gap-2">
          <span className={FIELD_LABEL}>
            {t('app.estimatedTimeSection')}
            {plannedWithEstimateRequired ? (
              <span className="text-tertiary" aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </span>
          <div className="flex flex-wrap items-end gap-3">
            <label className={`flex min-w-[6rem] flex-1 flex-col gap-1 ${FIELD_LABEL}`}>
              <span>{t('app.estimatedHours')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={MOTIVATOR_INPUT}
                placeholder="0"
                value={snap.estimatedHours}
                disabled={!canEdit}
                onChange={(e) => {
                  const p = reconcileEstimateAfterHoursEdit(
                    e.target.value,
                    snap.estimatedMinutesPart,
                  )
                  setSnap((s) => ({
                    ...s,
                    estimatedHours: p.hours,
                    estimatedMinutesPart: p.minutes,
                  }))
                }}
              />
            </label>
            <label className={`flex min-w-[6rem] flex-1 flex-col gap-1 ${FIELD_LABEL}`}>
              <span>{t('app.estimatedMinutesPart')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={MOTIVATOR_INPUT}
                placeholder="0"
                value={snap.estimatedMinutesPart}
                disabled={!canEdit}
                onChange={(e) => {
                  const p = reconcileEstimateAfterMinutesEdit(
                    snap.estimatedHours,
                    e.target.value,
                  )
                  setSnap((s) => ({
                    ...s,
                    estimatedHours: p.hours,
                    estimatedMinutesPart: p.minutes,
                  }))
                }}
              />
            </label>
          </div>
          <p className="text-[10px] leading-snug text-on-surface-variant">{t('app.estimateHint')}</p>
          {floatingEstimateWarning ? (
            <p className={TEXT_HINT_WARNING}>{floatingEstimateWarning}</p>
          ) : null}
        </div>

        <fieldset ref={recurrenceRef} className={FIELDSET}>
          <legend className={FIELDSET_LEGEND}>{t('app.recurrenceSection')}</legend>
          <select
            className={`mb-2 w-full ${MOTIVATOR_INPUT}`}
            value={snap.recurrenceKind}
            disabled={!canEdit}
            onChange={(e) => {
              const k = e.target.value as RecurrenceUiKind
              setSnap((s) => ({
                ...s,
                recurrenceKind: k,
                anchorLocalDate:
                  k !== 'none'
                    ? s.scheduledLocalDate ?? s.anchorLocalDate ?? selectedDayKey
                    : s.anchorLocalDate,
              }))
            }}
          >
            <option value="none">{t('app.recurrenceNone')}</option>
            <option value="daily">{t('app.recurrenceDaily')}</option>
            <option value="everyNDays">{t('app.recurrenceEveryNDays')}</option>
            <option value="weekly">{t('app.recurrenceWeekly')}</option>
          </select>

          {snap.recurrenceKind === 'everyNDays' && (
            <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
              <span>{t('app.everyNDaysLabel')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={MOTIVATOR_INPUT}
                value={String(snap.everyNDays)}
                disabled={!canEdit}
                onChange={(e) =>
                  setSnap((s) => ({
                    ...s,
                    everyNDays: sanitizeEveryNDaysInput(e.target.value),
                  }))
                }
              />
            </label>
          )}

          {snap.recurrenceKind === 'weekly' && (
            <div className="mt-2 flex flex-wrap gap-1">
              {weekdayButtons.map(({ d, label }) => (
                <button
                  key={d}
                  type="button"
                  disabled={!canEdit}
                  className={`${weekdayToggle(snap.weekdays.includes(d))} px-2 py-1 text-[11px] disabled:opacity-40`}
                  onClick={() =>
                    setSnap((s) => ({ ...s, weekdays: toggleWeekday(s.weekdays, d) }))
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {snap.recurrenceKind !== 'none' ? (
            <div className="mt-2">
              <LocalDatePickerField
                label={t('app.recurrenceAnchor')}
                value={snap.anchorLocalDate}
                minLocalDateKey={appLocalDateKey()}
                onChange={(v) =>
                  setSnap((s) => ({
                    ...s,
                    anchorLocalDate: clampPlanDateKey(
                      v ?? s.scheduledLocalDate ?? selectedDayKey,
                    ),
                  }))
                }
                disabled={!canEdit}
              />
            </div>
          ) : null}
        </fieldset>

        <details
          ref={additionalSettingsRef}
          className="motivator-card p-3"
          onToggle={(e) => {
            const el = e.currentTarget
            if (el.open) {
              requestAnimationFrame(() => {
                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
              })
            }
          }}
        >
          <summary className="cursor-pointer list-none font-display text-xs font-medium text-on-surface-variant [&::-webkit-details-marker]:hidden">
            {t('app.createTaskAdditionalSettings')}
          </summary>
          <div className="mt-3 flex flex-col gap-4 border-t border-surface-variant pt-3">
            <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
              <span>{t('app.group')}</span>
              <select
                className={MOTIVATOR_INPUT}
                value={snap.groupId}
                disabled={!canEdit}
                onChange={(e) => setSnap((s) => ({ ...s, groupId: e.target.value }))}
              >
                {sortedGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <TaskColorAccordion
              colorKey={snap.colorKey}
              colorHexInput={snap.colorHexInput}
              canEdit={canEdit}
              onPickKey={(key) =>
                setSnap((s) => ({
                  ...s,
                  colorKey: key,
                  colorHexInput: TASK_COLOR_HEX[key],
                }))
              }
              onHexInputChange={(raw) => {
                const rgb = parseColorInput(raw)
                setSnap((s) => ({
                  ...s,
                  colorHexInput: raw,
                  colorKey: rgb ? nearestTaskColorKey(rgb) : s.colorKey,
                }))
              }}
              onNativePick={(hex) => {
                const rgb = parseColorInput(hex)
                if (rgb) {
                  const key = nearestTaskColorKey(rgb)
                  setSnap((s) => ({
                    ...s,
                    colorKey: key,
                    colorHexInput: hex,
                  }))
                }
              }}
            />
            <label className={`flex cursor-pointer items-start gap-2 ${FIELD_LABEL}`}>
              <input
                type="checkbox"
                className={`mt-0.5 ${CHECKBOX_INPUT}`}
                checked={snap.doubleConfirmEnabled}
                disabled={!canEdit}
                onChange={(e) =>
                  setSnap((s) => ({ ...s, doubleConfirmEnabled: e.target.checked }))
                }
              />
              <span className="leading-snug">{t('app.doubleConfirmEnable')}</span>
            </label>
            <p className="text-[10px] leading-snug text-on-surface-variant">{t('app.doubleConfirmHintShort')}</p>
          </div>
        </details>

        </div>

        <div className={MODAL_FOOTER}>
          {saveAttempted && blockingLinesForSave.length > 0 ? (
            <div className={cn(ALERT_WARNING_MUTED, 'mb-3')}>
              <p className={ALERT_WARNING_TITLE}>{t('app.createTaskFooterHint')}</p>
              <ul className={cn('mt-1 list-disc space-y-0.5 pl-4', ALERT_WARNING_BODY)}>
                {blockingLinesForSave.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canEdit}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
              onClick={() => void handleSave()}
            >
              {t('common.save')}
            </button>
            <button
              type="button"
              className={SETTINGS_BTN_SECONDARY}
              onClick={() => handleAttemptClose()}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
      </div>

      {closeConfirmOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCloseConfirmOpen(false)
          }}
        >
          <div
            ref={closeConfirmRef}
            role="alertdialog"
            aria-modal
            aria-labelledby="create-task-close-title"
            className="motivator-card w-full max-w-sm p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-task-close-title" className={MODAL_TITLE}>
              {t('app.createTaskCloseTitle')}
            </h3>
            <p className="mt-2 text-sm leading-snug text-on-surface-variant">{closeConfirmHint}</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={SETTINGS_BTN_SECONDARY}
                onClick={() => setCloseConfirmOpen(false)}
              >
                {t('app.createTaskCloseStay')}
              </button>
              <button
                type="button"
                className="btn-primary px-3 py-2 text-sm"
                onClick={() => void finalizeDismissWithoutSave()}
              >
                {t('app.createTaskCloseLeave')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
