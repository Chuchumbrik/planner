import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DOUBLE_CONFIRM_DEFAULT_GRACE_MIN,
  DOUBLE_CONFIRM_DEFAULT_INTERVAL_MIN,
  TASK_COLOR_HEX,
  isMainTaskDoneForDay,
  mergeEstimateParts,
  minutesToTimeInput,
  nearestTaskColorKey,
  parseColorInput,
  parseLocalDateKey,
  splitEstimateMinutes,
  timeInputToMinutes,
  PRIORITY_RANKS,
  type PriorityLabels,
  type RecurrenceRule,
  type Task,
  type TaskColorKey,
  type TaskTimeMode,
  localDateKey,
} from '@motivator/core'
import {
  MAX_TASK_TITLE_CHARS,
  normalizeEstimatePair,
  reconcileEstimateAfterHoursEdit,
  reconcileEstimateAfterMinutesEdit,
  sanitizeChecklistItemInput,
  sanitizeEveryNDaysInput,
  sanitizeTaskTitleInput,
} from '@/lib/fieldSanitize'
import {
  computeFloatingEstimateDayWarning,
  computeRecurrenceAnchorPastError,
  computeTaskScheduleValidationError,
  type TaskScheduleValidationFields,
} from '@/lib/taskScheduleValidation'
import { useTranslation } from 'react-i18next'
import { TaskColorAccordion } from '@/components/TaskColorAccordion'
import { TaskTimeAccordion } from '@/components/TaskTimeAccordion'
import { LocalDatePickerField } from '@/components/LocalDatePickerField'
import {
  CHECKBOX_INPUT,
  FIELD_LABEL,
  FIELDSET,
  FIELDSET_LEGEND,
  MODAL_CLOSE_BTN,
  MODAL_FOOTER,
  MODAL_HEADER,
  MODAL_SHELL,
  MODAL_TITLE,
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
  weekdayToggle,
} from '@/lib/designClasses'

type RecurrenceUiKind = 'none' | 'daily' | 'everyNDays' | 'weekly'

function recurrenceUiKind(task: Task): RecurrenceUiKind {
  const r = task.recurrence
  if (!r) return 'none'
  if (r.kind === 'daily') return 'daily'
  if (r.kind === 'everyNDays') return 'everyNDays'
  return 'weekly'
}

function toggleWeekday(set: number[], d: number): number[] {
  const has = set.includes(d)
  if (has) return set.filter((x) => x !== d)
  return [...set, d].sort((a, b) => a - b)
}

function buildRecurrenceRule(
  kind: RecurrenceUiKind,
  everyNDays: number,
  weekdays: number[],
): RecurrenceRule | null {
  if (kind === 'none') return null
  if (kind === 'daily') return { kind: 'daily' }
  if (kind === 'everyNDays')
    return { kind: 'everyNDays', n: Math.max(1, Math.floor(everyNDays)) }
  const wd = [...new Set(weekdays.filter((x) => x >= 0 && x <= 6))].sort((a, b) => a - b)
  if (wd.length === 0) return null
  return { kind: 'weekly', weekdays: wd }
}

function defaultWeekdayFromKey(dateKey: string): number[] {
  const dt = parseLocalDateKey(dateKey)
  return dt ? [dt.getDay()] : [1]
}

type Props = {
  task: Task
  groups: { id: string; name: string; sortOrder: number }[]
  priorityLabels: PriorityLabels
  selectedDayKey: string
  /** Календарный день для отметки вхождения повтора (колонка недели или выбранный день) */
  occurrenceDayKey: string
  canEdit: boolean
  onApplyTaskPatch: (patch: Partial<Task>) => void
  onClose: () => void
  onRemove: () => void
  /** Повтор: убрать только вхождение на occurrenceDayKey (серия остаётся). */
  onSkipOccurrenceForDay?: (dateKey: string) => void
  onSetColor: (key: TaskColorKey) => void
  onSetGroup: (groupId: string) => void
  onSetPriorityRank: (rank: Task['priorityRank']) => void
  onSetScheduledLocalDate: (date: string | null) => void
  onSetEstimatedMinutes: (minutes: number | null) => void
  onSetTimePlan: (mode: TaskTimeMode, minutes: number | null) => void
  onTitleCommit: (title: string) => void
  onAddChecklistItem: (title: string) => void
  onToggleChecklistItem: (itemId: string) => void
  onRemoveChecklistItem: (itemId: string) => void
  /** Для повторяющейся задачи: переключить «выполнено» для occurrenceDayKey */
  onToggleOccurrenceForDay?: () => void
  /** Локальный календарный «сегодня» — отметка вхождения только при совпадении с occurrenceDayKey */
  todayLocalDateKey: string
}

export function TaskEditModal({
  task,
  groups,
  priorityLabels,
  selectedDayKey,
  occurrenceDayKey,
  canEdit,
  onApplyTaskPatch,
  onClose,
  onRemove,
  onSkipOccurrenceForDay,
  onSetColor,
  onSetGroup,
  onSetPriorityRank,
  onSetScheduledLocalDate,
  onSetEstimatedMinutes,
  onSetTimePlan,
  onTitleCommit,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  onToggleOccurrenceForDay,
  todayLocalDateKey,
}: Props) {
  const { t } = useTranslation()
  /** Портал в body + lock scroll: без этого на iOS/WebKit касания часто уходят на скроллящийся «планировщик» под модалкой. */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [checkDraft, setCheckDraft] = useState('')
  const [estHoursDraft, setEstHoursDraft] = useState('')
  const [estMinutesDraft, setEstMinutesDraft] = useState('')
  const [estFieldError, setEstFieldError] = useState<string | null>(null)
  const [commitGateError, setCommitGateError] = useState<string | null>(null)
  const [todayTimeFloorTick, setTodayTimeFloorTick] = useState(0)
  const [timeDraft, setTimeDraft] = useState(
    task.timeMinutesFromMidnight != null
      ? minutesToTimeInput(task.timeMinutesFromMidnight)
      : '',
  )

  const [everyNDaysDraft, setEveryNDaysDraft] = useState(
    task.recurrence?.kind === 'everyNDays' ? task.recurrence.n : 2,
  )
  const [colorHexDraft, setColorHexDraft] = useState(() => TASK_COLOR_HEX[task.colorKey])

  useEffect(() => {
    setTitleDraft(sanitizeTaskTitleInput(task.title))
  }, [task.id])

  useEffect(() => {
    if (task.recurrence?.kind === 'everyNDays') setEveryNDaysDraft(task.recurrence.n)
  }, [task])

  useEffect(() => {
    setColorHexDraft(TASK_COLOR_HEX[task.colorKey])
  }, [task.id, task.colorKey])

  useEffect(() => {
    const p = splitEstimateMinutes(task.estimatedMinutes)
    setEstHoursDraft(p.hours)
    setEstMinutesDraft(p.minutes)
    setEstFieldError(null)
  }, [task.id, task.estimatedMinutes])

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder)

  const anchorBase =
    task.recurrenceAnchorLocalDate ?? task.scheduledLocalDate ?? selectedDayKey

  const effectiveTimeClock = useMemo(() => {
    if (task.timeMode === 'none') return ''
    if (timeDraft.trim() !== '') return timeDraft
    if (task.timeMinutesFromMidnight != null) return minutesToTimeInput(task.timeMinutesFromMidnight)
    return ''
  }, [task.timeMode, task.timeMinutesFromMidnight, timeDraft])

  const planDateIsToday = useMemo(
    () => Boolean(task.scheduledLocalDate && task.scheduledLocalDate === localDateKey()),
    [task.scheduledLocalDate],
  )

  const canPlanOnSelectedDay = useMemo(
    () => selectedDayKey >= localDateKey(),
    [selectedDayKey],
  )

  useEffect(() => {
    if (!planDateIsToday) return
    const id = window.setInterval(() => setTodayTimeFloorTick((x) => x + 1), 60_000)
    return () => clearInterval(id)
  }, [planDateIsToday])

  const earliestClockMinutesFromMidnight = useMemo(() => {
    void todayTimeFloorTick
    if (!planDateIsToday) return null
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  }, [planDateIsToday, todayTimeFloorTick])

  useEffect(() => {
    if (!planDateIsToday || task.timeMode === 'none' || task.timeMinutesFromMidnight == null) return
    const floor = new Date().getHours() * 60 + new Date().getMinutes()
    if (task.timeMinutesFromMidnight < floor) {
      void onSetTimePlan(task.timeMode, floor)
      setTimeDraft(minutesToTimeInput(floor))
    }
  }, [
    planDateIsToday,
    task.timeMode,
    task.timeMinutesFromMidnight,
    task.id,
    onSetTimePlan,
    todayTimeFloorTick,
  ])

  const validationFields = useMemo(
    (): TaskScheduleValidationFields => ({
      backlogOnly: task.scheduledLocalDate === null,
      scheduledLocalDate: task.scheduledLocalDate,
      timeMode: task.timeMode,
      timeClock: effectiveTimeClock,
      estimatedHours: estHoursDraft,
      estimatedMinutesPart: estMinutesDraft,
      plannedWithEstimateRequired: task.scheduledLocalDate != null,
    }),
    [
      task.scheduledLocalDate,
      task.timeMode,
      effectiveTimeClock,
      estHoursDraft,
      estMinutesDraft,
    ],
  )

  const scheduleValidationError = useMemo(
    () => computeTaskScheduleValidationError(validationFields, t),
    [validationFields, t],
  )

  const anchorValidationError = useMemo(() => {
    if (!task.recurrence) return null
    const anchorStr = task.recurrenceAnchorLocalDate ?? anchorBase
    return computeRecurrenceAnchorPastError(anchorStr, true, t)
  }, [task.recurrence, task.recurrenceAnchorLocalDate, anchorBase, t])

  const floatingEstimateWarning = useMemo(
    () => computeFloatingEstimateDayWarning(validationFields, t),
    [validationFields, t],
  )

  useEffect(() => {
    if (!scheduleValidationError && !anchorValidationError) setCommitGateError(null)
  }, [scheduleValidationError, anchorValidationError])

  const occurrenceDoneThisDay = task.recurrence
    ? isMainTaskDoneForDay(task, occurrenceDayKey)
    : false
  const blockOccurrenceToggle =
    Boolean(task.recurrence) &&
    !occurrenceDoneThisDay &&
    task.checklist.length > 0 &&
    task.checklist.some((s) => !s.done)
  const blockOccurrenceByCalendarDay =
    Boolean(task.recurrence) && occurrenceDayKey !== todayLocalDateKey

  /** Отметки пунктов чек-листа «выполнено» — только в календарный сегодня (как главная галочка на `/app`). */
  const checklistProgressToggleAllowed = occurrenceDayKey === todayLocalDateKey

  function pushRecurrencePatch(
    kind: RecurrenceUiKind,
    opts?: { everyN?: number; weekdays?: number[] },
  ) {
    let everyN =
      opts?.everyN ??
      (kind === 'everyNDays' && task.recurrence?.kind === 'everyNDays'
        ? task.recurrence.n
        : everyNDaysDraft)
    if (kind === 'everyNDays') everyN = Math.max(1, Math.floor(everyN))

    let wd =
      opts?.weekdays ??
      (task.recurrence?.kind === 'weekly' ? [...task.recurrence.weekdays] : [])
    if (kind === 'weekly' && wd.length === 0) wd = defaultWeekdayFromKey(anchorBase)

    const rule = buildRecurrenceRule(kind, kind === 'everyNDays' ? everyN : 2, wd)
    if (!rule) {
      void onApplyTaskPatch({ recurrence: null, recurrenceAnchorLocalDate: null })
      return
    }
    const anchor = anchorBase || selectedDayKey
    const anchorErr = computeRecurrenceAnchorPastError(anchor, true, t)
    if (anchorErr) {
      setCommitGateError(anchorErr)
      return
    }
    setCommitGateError(null)
    void onApplyTaskPatch({
      recurrence: rule,
      recurrenceAnchorLocalDate: anchor,
    })
  }

  function requestRemoveEntireTask() {
    if (task.checklist.length > 0) {
      if (!window.confirm(t('app.confirmDeleteTaskWithChecklist'))) return
    }
    if (task.recurrence && !window.confirm(t('app.confirmDeleteTaskEntire'))) return
    onRemove()
    onClose()
  }

  function requestSkipOccurrence() {
    if (!onSkipOccurrenceForDay) return
    if (!window.confirm(t('app.confirmSkipOccurrenceForDay', { date: occurrenceDayKey }))) return
    onSkipOccurrenceForDay(occurrenceDayKey)
    onClose()
  }

  function handleBlurTitle() {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== task.title) onTitleCommit(trimmed)
    else setTitleDraft(sanitizeTaskTitleInput(task.title))
  }

  function commitEstimate() {
    const norm = normalizeEstimatePair(estHoursDraft, estMinutesDraft)
    setEstHoursDraft(norm.hours)
    setEstMinutesDraft(norm.minutes)
    const r = mergeEstimateParts(norm.hours, norm.minutes)
    if (r.invalid) {
      setEstFieldError(t('app.estimateInvalid'))
      const p = splitEstimateMinutes(task.estimatedMinutes)
      setEstHoursDraft(p.hours)
      setEstMinutesDraft(p.minutes)
      return
    }
    const planned = task.scheduledLocalDate != null
    if (planned && r.total == null) {
      setEstFieldError(t('app.estimateRequiredWhenPlanned'))
      const p = splitEstimateMinutes(task.estimatedMinutes)
      setEstHoursDraft(p.hours)
      setEstMinutesDraft(p.minutes)
      return
    }
    const merged: TaskScheduleValidationFields = {
      backlogOnly: task.scheduledLocalDate === null,
      scheduledLocalDate: task.scheduledLocalDate,
      timeMode: task.timeMode,
      timeClock: effectiveTimeClock,
      estimatedHours: norm.hours,
      estimatedMinutesPart: norm.minutes,
      plannedWithEstimateRequired: task.scheduledLocalDate != null,
    }
    const schedErr = computeTaskScheduleValidationError(merged, t)
    if (schedErr) {
      setCommitGateError(schedErr)
      const p = splitEstimateMinutes(task.estimatedMinutes)
      setEstHoursDraft(p.hours)
      setEstMinutesDraft(p.minutes)
      return
    }
    setEstFieldError(null)
    setCommitGateError(null)
    void onSetEstimatedMinutes(r.total)
  }

  function guardedSetScheduledLocalDate(date: string | null) {
    const todayKey = localDateKey()
    const resolvedDate =
      date != null && /^\d{4}-\d{2}-\d{2}$/.test(date) && date < todayKey ? todayKey : date

    const floor =
      resolvedDate === todayKey ? new Date().getHours() * 60 + new Date().getMinutes() : null
    let timeClockForVal = effectiveTimeClock
    if (floor != null && task.timeMode !== 'none') {
      let m = timeInputToMinutes(timeDraft.trim())
      if (m == null && task.timeMinutesFromMidnight != null) m = task.timeMinutesFromMidnight
      if (m == null) m = task.timeMode === 'start' ? 9 * 60 : 18 * 60
      if (m < floor) {
        m = floor
        timeClockForVal = minutesToTimeInput(m)
        setTimeDraft(timeClockForVal)
        void onSetTimePlan(task.timeMode, m)
      }
    }

    const merged: TaskScheduleValidationFields = {
      backlogOnly: resolvedDate === null,
      scheduledLocalDate: resolvedDate,
      timeMode: task.timeMode,
      timeClock: task.timeMode === 'none' ? '' : timeClockForVal,
      estimatedHours: estHoursDraft,
      estimatedMinutesPart: estMinutesDraft,
      plannedWithEstimateRequired: resolvedDate != null,
    }
    const err = computeTaskScheduleValidationError(merged, t)
    if (err) {
      setCommitGateError(err)
      return
    }
    setCommitGateError(null)
    void onSetScheduledLocalDate(resolvedDate)
  }

  function applyTime(mode: TaskTimeMode) {
    if (mode === 'none') {
      const merged: TaskScheduleValidationFields = {
        backlogOnly: task.scheduledLocalDate === null,
        scheduledLocalDate: task.scheduledLocalDate,
        timeMode: 'none',
        timeClock: '',
        estimatedHours: estHoursDraft,
        estimatedMinutesPart: estMinutesDraft,
        plannedWithEstimateRequired: task.scheduledLocalDate != null,
      }
      const err = computeTaskScheduleValidationError(merged, t)
      if (err) {
        setCommitGateError(err)
        return
      }
      setCommitGateError(null)
      void onSetTimePlan('none', null)
      setTimeDraft('')
      return
    }
    let m = timeInputToMinutes(timeDraft)
    if (m == null) {
      m = mode === 'start' ? 9 * 60 : 18 * 60
    }
    if (planDateIsToday) {
      const floor = new Date().getHours() * 60 + new Date().getMinutes()
      if (m < floor) m = floor
    }
    const clockStr = minutesToTimeInput(m)
    setTimeDraft(clockStr)
    const merged: TaskScheduleValidationFields = {
      backlogOnly: task.scheduledLocalDate === null,
      scheduledLocalDate: task.scheduledLocalDate,
      timeMode: mode,
      timeClock: clockStr,
      estimatedHours: estHoursDraft,
      estimatedMinutesPart: estMinutesDraft,
      plannedWithEstimateRequired: task.scheduledLocalDate != null,
    }
    const err = computeTaskScheduleValidationError(merged, t)
    if (err) {
      setCommitGateError(err)
      return
    }
    setCommitGateError(null)
    void onSetTimePlan(mode, m)
  }

  function guardedAnchorChange(v: string | null) {
    const anchorCandidate = (v ?? anchorBase).trim()
    const resolved =
      anchorCandidate && /^\d{4}-\d{2}-\d{2}$/.test(anchorCandidate)
        ? anchorCandidate
        : anchorBase
    const err = computeRecurrenceAnchorPastError(resolved, true, t)
    if (err) {
      setCommitGateError(err)
      return
    }
    setCommitGateError(null)
    void onApplyTaskPatch({
      recurrenceAnchorLocalDate: v || null,
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex min-h-dvh w-full items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={MODAL_SHELL}>
        <div className={MODAL_HEADER}>
          <h2 className={MODAL_TITLE}>{t('app.editTask')}</h2>
          <button
            type="button"
            className={MODAL_CLOSE_BTN}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="scrollbar-site flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2 pt-3">
        <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>{t('app.taskTitle')}</span>
            <span className="font-normal text-on-surface-variant">
              {titleDraft.length}/{MAX_TASK_TITLE_CHARS}
            </span>
          </span>
          <input
            className={MOTIVATOR_INPUT}
            value={titleDraft}
            disabled={!canEdit}
            onChange={(e) => setTitleDraft(sanitizeTaskTitleInput(e.target.value))}
            onBlur={() => handleBlurTitle()}
          />
        </label>

        <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
          <span>{t('app.priorityShort')}</span>
          <select
            className={MOTIVATOR_INPUT}
            value={task.priorityRank}
            disabled={!canEdit}
            onChange={(e) =>
              onSetPriorityRank(Number(e.target.value) as Task['priorityRank'])
            }
          >
            {PRIORITY_RANKS.map((r) => (
              <option key={r} value={r}>
                {priorityLabels[r]}
              </option>
            ))}
          </select>
        </label>

        <fieldset className={FIELDSET}>
          <legend className={FIELDSET_LEGEND}>{t('app.scheduleSection')}</legend>
          <div className="flex flex-col gap-3">
            <LocalDatePickerField
              label={t('app.plannedDate')}
              value={task.scheduledLocalDate}
              minLocalDateKey={localDateKey()}
              onChange={(v) => guardedSetScheduledLocalDate(v)}
              disabled={!canEdit}
              allowClear
            />
            <p className="text-xs text-on-surface-variant">{t('app.backlogHint')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canEdit}
                className={`${SETTINGS_BTN_SECONDARY} text-xs`}
                onClick={() => guardedSetScheduledLocalDate(null)}
              >
                {t('app.moveToBacklog')}
              </button>
              <button
                type="button"
                disabled={!canEdit || !canPlanOnSelectedDay}
                className={`${SETTINGS_BTN_SECONDARY} text-xs`}
                onClick={() => guardedSetScheduledLocalDate(selectedDayKey)}
              >
                {t('app.planForSelectedDay', { date: selectedDayKey })}
              </button>
            </div>
          </div>
        </fieldset>

        <div>
          <TaskTimeAccordion
            timeMode={task.timeMode}
            timeClock={
              task.timeMode === 'none'
                ? ''
                : timeDraft ||
                  (task.timeMinutesFromMidnight != null
                    ? minutesToTimeInput(task.timeMinutesFromMidnight)
                    : '')
            }
            canEdit={canEdit}
            radioName="timemode"
            onModeNone={() => {
              void onSetTimePlan('none', null)
              setTimeDraft('')
            }}
            onModeStart={() => applyTime('start')}
            onModeEnd={() => applyTime('end')}
            onClockChange={(value) => setTimeDraft(value)}
            onClockBlur={() => {
              if (task.timeMode !== 'none') applyTime(task.timeMode)
            }}
            earliestClockMinutesFromMidnight={earliestClockMinutesFromMidnight}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={FIELD_LABEL}>{t('app.estimatedTimeSection')}</span>
          <div className="flex flex-wrap items-end gap-3">
            <label className={`flex min-w-[6rem] flex-1 flex-col gap-1 ${FIELD_LABEL}`}>
              <span>{t('app.estimatedHours')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={MOTIVATOR_INPUT}
                placeholder="0"
                value={estHoursDraft}
                disabled={!canEdit}
                onChange={(e) => {
                  const p = reconcileEstimateAfterHoursEdit(e.target.value, estMinutesDraft)
                  setEstHoursDraft(p.hours)
                  setEstMinutesDraft(p.minutes)
                }}
                onBlur={() => commitEstimate()}
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
                value={estMinutesDraft}
                disabled={!canEdit}
                onChange={(e) => {
                  const p = reconcileEstimateAfterMinutesEdit(estHoursDraft, e.target.value)
                  setEstHoursDraft(p.hours)
                  setEstMinutesDraft(p.minutes)
                }}
                onBlur={() => commitEstimate()}
              />
            </label>
          </div>
          {estFieldError ? <p className="text-xs text-red-400">{estFieldError}</p> : null}
          <p className="text-[10px] leading-snug text-on-surface-variant">{t('app.estimateHint')}</p>
          {floatingEstimateWarning ? (
            <p className="text-[11px] leading-snug text-amber-400/90">{floatingEstimateWarning}</p>
          ) : null}
        </div>

        <fieldset className={FIELDSET}>
          <legend className={FIELDSET_LEGEND}>{t('app.recurrenceSection')}</legend>
          <select
            className={`mb-2 w-full ${MOTIVATOR_INPUT}`}
            value={recurrenceUiKind(task)}
            disabled={!canEdit}
            onChange={(e) => {
              const k = e.target.value as RecurrenceUiKind
              pushRecurrencePatch(k)
            }}
          >
            <option value="none">{t('app.recurrenceNone')}</option>
            <option value="daily">{t('app.recurrenceDaily')}</option>
            <option value="everyNDays">{t('app.recurrenceEveryNDays')}</option>
            <option value="weekly">{t('app.recurrenceWeekly')}</option>
          </select>

          {task.recurrence?.kind === 'everyNDays' && (
            <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
              <span>{t('app.everyNDaysLabel')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={MOTIVATOR_INPUT}
                value={String(everyNDaysDraft)}
                disabled={!canEdit}
                onChange={(e) => {
                  const n = sanitizeEveryNDaysInput(e.target.value)
                  setEveryNDaysDraft(n)
                  pushRecurrencePatch('everyNDays', { everyN: n })
                }}
              />
            </label>
          )}

          {task.recurrence?.kind === 'weekly' && (
            <div className="mt-2 flex flex-wrap gap-1">
              {[
                { d: 1, label: t('app.weekdayMon') },
                { d: 2, label: t('app.weekdayTue') },
                { d: 3, label: t('app.weekdayWed') },
                { d: 4, label: t('app.weekdayThu') },
                { d: 5, label: t('app.weekdayFri') },
                { d: 6, label: t('app.weekdaySat') },
                { d: 0, label: t('app.weekdaySun') },
              ].map(({ d, label }) => (
                <button
                  key={d}
                  type="button"
                  disabled={!canEdit}
                  className={`${weekdayToggle(
                    task.recurrence?.kind === 'weekly' && task.recurrence.weekdays.includes(d),
                  )} px-2 py-1 text-[11px] disabled:opacity-40`}
                  onClick={() => {
                    if (task.recurrence?.kind !== 'weekly') return
                    const next = toggleWeekday([...task.recurrence.weekdays], d)
                    pushRecurrencePatch('weekly', { weekdays: next })
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {task.recurrence ? (
            <div className="mt-2">
              <LocalDatePickerField
                label={t('app.recurrenceAnchor')}
                value={task.recurrenceAnchorLocalDate ?? anchorBase}
                minLocalDateKey={localDateKey()}
                onChange={(v) => {
                  if (!task.recurrence) return
                  guardedAnchorChange(v)
                }}
                disabled={!canEdit}
              />
            </div>
          ) : null}
          {task.recurrence ? (
            <p className="mt-2 text-[10px] leading-snug text-on-surface-variant">
              {t('app.recurrenceEditHint')}
            </p>
          ) : null}
          {task.recurrence && onToggleOccurrenceForDay ? (
            <label
              className={`mt-3 flex items-start gap-2 text-xs text-on-surface ${
                !canEdit || blockOccurrenceToggle || blockOccurrenceByCalendarDay
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                className={`mt-0.5 ${CHECKBOX_INPUT}`}
                checked={occurrenceDoneThisDay}
                disabled={
                  !canEdit || blockOccurrenceToggle || blockOccurrenceByCalendarDay
                }
                onChange={() => onToggleOccurrenceForDay()}
              />
              <span>
                {t('app.recurrenceDoneThisDay', { date: occurrenceDayKey })}
                {blockOccurrenceToggle ? (
                  <span className="block text-[10px] text-on-surface-variant">
                    {t('app.completeParentAfterChecklist')}
                  </span>
                ) : null}
                {blockOccurrenceByCalendarDay ? (
                  <span className="block text-[10px] text-on-surface-variant">
                    {t('app.completionOnlyToday')}
                  </span>
                ) : null}
              </span>
            </label>
          ) : null}
        </fieldset>

        <div className="border-t border-surface-variant pt-4">
          <p className="font-display text-xs font-medium text-on-surface-variant">{t('app.checklistTitle')}</p>
          {!checklistProgressToggleAllowed ? (
            <p className="mt-1 text-[10px] leading-snug text-on-surface-variant">{t('app.completionOnlyToday')}</p>
          ) : null}
          <ul className="mt-2 flex flex-col gap-2">
            {task.checklist.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <label
                  className={`flex flex-1 items-start gap-2 ${
                    !canEdit || !checklistProgressToggleAllowed
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={s.done}
                    disabled={!canEdit || !checklistProgressToggleAllowed}
                    title={
                      !checklistProgressToggleAllowed ? t('app.completionOnlyToday') : undefined
                    }
                    onChange={() => onToggleChecklistItem(s.id)}
                    className={`mt-0.5 ${CHECKBOX_INPUT}`}
                  />
                  <span
                    className={`text-xs ${s.done ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}
                  >
                    {s.title}
                  </span>
                </label>
                <button
                  type="button"
                  disabled={!canEdit}
                  className="text-[11px] text-on-surface-variant hover:text-error disabled:opacity-40"
                  onClick={() => onRemoveChecklistItem(s.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!canEdit) return
              const v = checkDraft.trim()
              if (!v) return
              onAddChecklistItem(v)
              setCheckDraft('')
            }}
          >
            <input
              className={`${MOTIVATOR_INPUT} flex-1 px-2 py-1.5 text-base`}
              placeholder={t('app.addChecklistItem')}
              value={checkDraft}
              disabled={!canEdit}
              onChange={(e) =>
                setCheckDraft(sanitizeChecklistItemInput(e.target.value))
              }
            />
            <button
              type="submit"
              disabled={!canEdit}
              className={`${SETTINGS_BTN_SECONDARY} px-2 py-1 text-xs`}
            >
              {t('common.add')}
            </button>
          </form>
        </div>

        <details className="motivator-card p-3">
          <summary className="cursor-pointer font-display text-xs font-medium text-on-surface-variant">
            {t('app.createTaskAdditionalSettings')}
          </summary>
          <div className="mt-3 flex flex-col gap-4 border-t border-surface-variant pt-3">
            <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
              <span>{t('app.group')}</span>
              <select
                className={MOTIVATOR_INPUT}
                value={task.groupId}
                disabled={!canEdit}
                onChange={(e) => onSetGroup(e.target.value)}
              >
                {sortedGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <TaskColorAccordion
              colorKey={task.colorKey}
              colorHexInput={colorHexDraft}
              canEdit={canEdit}
              onPickKey={(key) => {
                onSetColor(key)
                setColorHexDraft(TASK_COLOR_HEX[key])
              }}
              onHexInputChange={(raw) => {
                setColorHexDraft(raw)
                const rgb = parseColorInput(raw)
                if (rgb) onSetColor(nearestTaskColorKey(rgb))
              }}
              onNativePick={(hex) => {
                const rgb = parseColorInput(hex)
                if (rgb) {
                  const key = nearestTaskColorKey(rgb)
                  onSetColor(key)
                  setColorHexDraft(hex)
                }
              }}
            />
            <label className={`flex cursor-pointer items-start gap-2 ${FIELD_LABEL}`}>
              <input
                type="checkbox"
                className={`mt-0.5 ${CHECKBOX_INPUT}`}
                checked={task.includeInEodRitual !== false}
                disabled={!canEdit}
                onChange={(e) => onApplyTaskPatch({ includeInEodRitual: e.target.checked })}
              />
              <span className="leading-snug">{t('app.includeInEodRitual')}</span>
            </label>
            <fieldset className={FIELDSET}>
              <legend className={FIELDSET_LEGEND}>{t('app.doubleConfirmSection')}</legend>
              <label className={`flex cursor-pointer items-start gap-2 ${FIELD_LABEL}`}>
                <input
                  type="checkbox"
                  className={`mt-0.5 ${CHECKBOX_INPUT}`}
                  checked={task.doubleConfirmEnabled === true}
                  disabled={!canEdit}
                  onChange={(e) =>
                    onApplyTaskPatch({ doubleConfirmEnabled: e.target.checked })
                  }
                />
                <span className="leading-snug">{t('app.doubleConfirmEnable')}</span>
              </label>
              <p className="mt-2 text-[10px] leading-snug text-on-surface-variant">{t('app.doubleConfirmHintEdit')}</p>

              {task.doubleConfirmEnabled ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
                    <span>{t('app.doubleConfirmIntervalMin')}</span>
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      inputMode="numeric"
                      className={MOTIVATOR_INPUT}
                      placeholder={String(DOUBLE_CONFIRM_DEFAULT_INTERVAL_MIN)}
                      value={task.doubleConfirmIntervalMinutes ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => {
                        const raw = e.target.value.trim()
                        if (raw === '') {
                          onApplyTaskPatch({ doubleConfirmIntervalMinutes: undefined })
                          return
                        }
                        const n = Number(raw)
                        if (!Number.isFinite(n)) return
                        onApplyTaskPatch({
                          doubleConfirmIntervalMinutes: Math.min(1440, Math.max(1, Math.floor(n))),
                        })
                      }}
                    />
                  </label>
                  <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
                    <span>{t('app.doubleConfirmGraceMin')}</span>
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      inputMode="numeric"
                      className={MOTIVATOR_INPUT}
                      placeholder={String(DOUBLE_CONFIRM_DEFAULT_GRACE_MIN)}
                      value={task.doubleConfirmGraceMinutes ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => {
                        const raw = e.target.value.trim()
                        if (raw === '') {
                          onApplyTaskPatch({ doubleConfirmGraceMinutes: undefined })
                          return
                        }
                        const n = Number(raw)
                        if (!Number.isFinite(n)) return
                        onApplyTaskPatch({
                          doubleConfirmGraceMinutes: Math.min(1440, Math.max(1, Math.floor(n))),
                        })
                      }}
                    />
                  </label>
                </div>
              ) : null}

              {task.doubleConfirmEnabled &&
              task.doubleConfirmPending &&
              task.doubleConfirmPending.localDate === occurrenceDayKey ? (
                <div className="mt-3 rounded-md border border-amber-800/60 bg-amber-950/25 px-3 py-2 text-xs text-amber-100/90">
                  <p className="leading-snug">{t('app.doubleConfirmPendingInEditor')}</p>
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="mt-2 text-[11px] text-amber-300 underline hover:text-amber-200 disabled:opacity-40"
                    onClick={() => onApplyTaskPatch({ doubleConfirmPending: undefined })}
                  >
                    {t('app.doubleConfirmCancelPending')}
                  </button>
                </div>
              ) : null}
            </fieldset>
          </div>
        </details>

        </div>

        <div className={`${MODAL_FOOTER} flex flex-col gap-3 pt-4`}>
          {commitGateError || scheduleValidationError || anchorValidationError ? (
            <p className="text-xs text-red-400" role="alert">
              {commitGateError ?? scheduleValidationError ?? anchorValidationError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canEdit}
            className="rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
            onClick={() => requestRemoveEntireTask()}
          >
            {task.recurrence ? t('app.deleteTaskEntireSeries') : t('common.delete')}
          </button>
          {task.recurrence && onSkipOccurrenceForDay ? (
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg border border-amber-900/50 px-3 py-2 text-sm text-amber-200 hover:bg-amber-950/40 disabled:opacity-40"
              onClick={() => requestSkipOccurrence()}
            >
              {t('app.removeFromPlanThisDay')}
            </button>
          ) : null}
          <button
            type="button"
            className={`${SETTINGS_BTN_SECONDARY} ml-auto`}
            onClick={onClose}
          >
            {t('common.close')}
          </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
