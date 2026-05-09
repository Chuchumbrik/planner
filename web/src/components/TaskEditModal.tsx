import { useEffect, useMemo, useState } from 'react'
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
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [checkDraft, setCheckDraft] = useState('')
  const [estHoursDraft, setEstHoursDraft] = useState('')
  const [estMinutesDraft, setEstMinutesDraft] = useState('')
  const [estFieldError, setEstFieldError] = useState<string | null>(null)
  const [commitGateError, setCommitGateError] = useState<string | null>(null)
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

  function requestRemove() {
    if (task.checklist.length > 0) {
      if (!window.confirm(t('app.confirmDeleteTaskWithChecklist'))) return
    }
    onRemove()
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
    const merged: TaskScheduleValidationFields = {
      backlogOnly: date === null,
      scheduledLocalDate: date,
      timeMode: task.timeMode,
      timeClock: effectiveTimeClock,
      estimatedHours: estHoursDraft,
      estimatedMinutesPart: estMinutesDraft,
      plannedWithEstimateRequired: date != null,
    }
    const err = computeTaskScheduleValidationError(merged, t)
    if (err) {
      setCommitGateError(err)
      return
    }
    setCommitGateError(null)
    void onSetScheduledLocalDate(date)
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
      setTimeDraft(minutesToTimeInput(m))
    }
    const clockStr = minutesToTimeInput(m)
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="scrollbar-site max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">{t('app.editTask')}</h2>
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <label className="mt-3 flex flex-col gap-1 text-xs text-zinc-500">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>{t('app.taskTitle')}</span>
            <span className="font-normal text-zinc-600">
              {titleDraft.length}/{MAX_TASK_TITLE_CHARS}
            </span>
          </span>
          <input
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
            value={titleDraft}
            disabled={!canEdit}
            onChange={(e) => setTitleDraft(sanitizeTaskTitleInput(e.target.value))}
            onBlur={() => handleBlurTitle()}
          />
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

        <label className="mt-4 flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.group')}</span>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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

        <label className="mt-4 flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.priorityShort')}</span>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={task.includeInEodRitual !== false}
            disabled={!canEdit}
            onChange={(e) => onApplyTaskPatch({ includeInEodRitual: e.target.checked })}
          />
          <span className="leading-snug">{t('app.includeInEodRitual')}</span>
        </label>

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.doubleConfirmSection')}</legend>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={task.doubleConfirmEnabled === true}
              disabled={!canEdit}
              onChange={(e) =>
                onApplyTaskPatch({ doubleConfirmEnabled: e.target.checked })
              }
            />
            <span className="leading-snug">{t('app.doubleConfirmEnable')}</span>
          </label>
          <p className="mt-2 text-[10px] leading-snug text-zinc-600">{t('app.doubleConfirmHintEdit')}</p>

          {task.doubleConfirmEnabled ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                <span>{t('app.doubleConfirmIntervalMin')}</span>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  inputMode="numeric"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                <span>{t('app.doubleConfirmGraceMin')}</span>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  inputMode="numeric"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.scheduleSection')}</legend>
          <LocalDatePickerField
            label={t('app.plannedDate')}
            value={task.scheduledLocalDate}
            onChange={(v) => guardedSetScheduledLocalDate(v)}
            disabled={!canEdit}
            allowClear
          />
          <p className="mt-2 text-xs text-zinc-600">{t('app.backlogHint')}</p>
          <button
            type="button"
            disabled={!canEdit}
            className="mt-2 rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            onClick={() => guardedSetScheduledLocalDate(null)}
          >
            {t('app.moveToBacklog')}
          </button>
          <button
            type="button"
            disabled={!canEdit}
            className="mt-2 ml-2 rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            onClick={() => guardedSetScheduledLocalDate(selectedDayKey)}
          >
            {t('app.planForSelectedDay', { date: selectedDayKey })}
          </button>
        </fieldset>

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.recurrenceSection')}</legend>
          <select
            className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.everyNDaysLabel')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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
                  className={`rounded border px-2 py-1 text-[11px] disabled:opacity-40 ${
                    task.recurrence?.kind === 'weekly' && task.recurrence.weekdays.includes(d)
                      ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
                      : 'border-zinc-700 text-zinc-500'
                  }`}
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
                onChange={(v) => {
                  if (!task.recurrence) return
                  guardedAnchorChange(v)
                }}
                disabled={!canEdit}
              />
            </div>
          ) : null}
          {task.recurrence ? (
            <p className="mt-2 text-[10px] leading-snug text-zinc-600">
              {t('app.recurrenceEditHint')}
            </p>
          ) : null}
          {task.recurrence && onToggleOccurrenceForDay ? (
            <label
              className={`mt-3 flex items-start gap-2 text-xs text-zinc-300 ${
                !canEdit || blockOccurrenceToggle || blockOccurrenceByCalendarDay
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
                checked={occurrenceDoneThisDay}
                disabled={
                  !canEdit || blockOccurrenceToggle || blockOccurrenceByCalendarDay
                }
                onChange={() => onToggleOccurrenceForDay()}
              />
              <span>
                {t('app.recurrenceDoneThisDay', { date: occurrenceDayKey })}
                {blockOccurrenceToggle ? (
                  <span className="block text-[10px] text-zinc-600">
                    {t('app.completeParentAfterChecklist')}
                  </span>
                ) : null}
                {blockOccurrenceByCalendarDay ? (
                  <span className="block text-[10px] text-zinc-600">
                    {t('app.completionOnlyToday')}
                  </span>
                ) : null}
              </span>
            </label>
          ) : null}
        </fieldset>

        <div className="mt-4 flex flex-col gap-2">
          <span className="text-xs text-zinc-500">{t('app.estimatedTimeSection')}</span>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[6rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.estimatedHours')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-white disabled:opacity-40"
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
            <label className="flex min-w-[6rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.estimatedMinutesPart')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-white disabled:opacity-40"
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
          <p className="text-[10px] leading-snug text-zinc-600">{t('app.estimateHint')}</p>
          {floatingEstimateWarning ? (
            <p className="text-[11px] leading-snug text-amber-400/90">{floatingEstimateWarning}</p>
          ) : null}
        </div>

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
        />

        <div className="mt-4 border-t border-zinc-800 pt-4">
          <p className="text-xs font-medium text-zinc-400">{t('app.checklistTitle')}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {task.checklist.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <label className="flex flex-1 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={s.done}
                    disabled={!canEdit}
                    onChange={() => onToggleChecklistItem(s.id)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
                  />
                  <span
                    className={`text-xs ${s.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}
                  >
                    {s.title}
                  </span>
                </label>
                <button
                  type="button"
                  disabled={!canEdit}
                  className="text-[11px] text-zinc-500 hover:text-red-400 disabled:opacity-40"
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
              className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-base text-white outline-none focus:ring-1 focus:ring-emerald-500/80 disabled:opacity-40"
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
              className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
            >
              {t('common.add')}
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-4">
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
            onClick={() => requestRemove()}
          >
            {t('common.delete')}
          </button>
          <button
            type="button"
            className="ml-auto rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
