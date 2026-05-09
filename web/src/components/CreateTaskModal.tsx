import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalDatePickerField } from '@/components/LocalDatePickerField'
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

type RecurrenceUiKind = 'none' | 'daily' | 'everyNDays' | 'weekly'

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
    scheduledLocalDate: d.scheduledLocalDate,
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
    anchorLocalDate: d.recurrenceAnchorLocalDate ?? d.scheduledLocalDate ?? fallbackDay,
  }
}

function emptySnapshot(selectedDayKey: string, groupId: string): Snapshot {
  return {
    title: '',
    groupId,
    colorKey: 'zinc',
    colorHexInput: TASK_COLOR_HEX.zinc,
    priorityRank: 3,
    backlogOnly: false,
    scheduledLocalDate: selectedDayKey,
    estimatedHours: '',
    estimatedMinutesPart: '',
    timeMode: 'none',
    timeClock: '',
    recurrenceKind: 'none',
    everyNDays: 2,
    weekdays: [],
    anchorLocalDate: selectedDayKey,
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
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups])

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
    draftIdRef.current = resumeDraft?.id ?? null
    const base = resumeDraft
      ? snapshotFromDraft(resumeDraft, selectedDayKey)
      : emptySnapshot(selectedDayKey, defaultGroupId)
    initialRef.current = JSON.parse(JSON.stringify(base)) as Snapshot
    setSnap(base)
    setEstimateError(null)
  }, [open, resumeDraft, selectedDayKey, defaultGroupId])

  const isDirty = useMemo(() => {
    const init = initialRef.current
    if (!init) return false
    return snapshotCanonical(snap, selectedDayKey) !== snapshotCanonical(init, selectedDayKey)
  }, [snap, selectedDayKey])

  const plannedWithEstimateRequired = useMemo(
    () => !snap.backlogOnly && snap.scheduledLocalDate != null,
    [snap.backlogOnly, snap.scheduledLocalDate],
  )

  const estimateBlocked = useMemo(() => {
    const estNorm = normalizeEstimatePair(snap.estimatedHours, snap.estimatedMinutesPart)
    const estMerge = mergeEstimateParts(estNorm.hours, estNorm.minutes)
    return estMerge.invalid || (plannedWithEstimateRequired && estMerge.total == null)
  }, [
    snap.estimatedHours,
    snap.estimatedMinutesPart,
    plannedWithEstimateRequired,
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

  useEffect(() => {
    setEstimateError(null)
  }, [
    snap.estimatedHours,
    snap.estimatedMinutesPart,
    snap.backlogOnly,
    snap.scheduledLocalDate,
    snap.timeMode,
    snap.timeClock,
  ])

  function parseTimeForSubmit(): { mode: TaskTimeMode; minutes: number | null } {
    if (snap.timeMode === 'none') return { mode: 'none', minutes: null }
    let m = timeInputToMinutes(snap.timeClock)
    if (m == null) m = 9 * 60
    return { mode: snap.timeMode, minutes: m }
  }

  async function handleSave() {
    const trimmed = snap.title.trim()
    if (!trimmed || !canEdit) return

    const estNorm = normalizeEstimatePair(snap.estimatedHours, snap.estimatedMinutesPart)
    const estMerge = mergeEstimateParts(estNorm.hours, estNorm.minutes)
    if (estMerge.invalid) {
      setEstimateError(t('app.estimateInvalid'))
      return
    }
    if (plannedWithEstimateRequired && estMerge.total == null) {
      setEstimateError(t('app.estimateRequiredWhenPlanned'))
      return
    }

    const schedErr = computeTaskScheduleValidationError(validationFields, t)
    if (schedErr) {
      setEstimateError(schedErr)
      return
    }

    const { recurrenceFinal, anchorOut } = resolveCreateRecurrenceAnchor(snap, selectedDayKey)
    const anchorErr = computeRecurrenceAnchorPastError(anchorOut, Boolean(recurrenceFinal), t)
    if (anchorErr) {
      setEstimateError(anchorErr)
      return
    }
    setEstimateError(null)

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
    setCloseConfirmOpen(true)
  }, [onClose])

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
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center"
        role="dialog"
        aria-modal
        aria-hidden={closeConfirmOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleAttemptClose()
        }}
      >
      <div className="scrollbar-site max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">{t('app.createTaskTitle')}</h2>
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300"
            onClick={() => handleAttemptClose()}
          >
            ✕
          </button>
        </div>

        <p className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">
          <span className="font-medium text-amber-200/95">{t('app.createTaskSaveRequirementsHeading')}</span>{' '}
          {plannedWithEstimateRequired
            ? t('app.createTaskSaveRequirementsBodyPlanned')
            : t('app.createTaskSaveRequirementsBodyBacklog')}
        </p>

        <label className="mt-3 flex flex-col gap-1 text-xs text-zinc-500">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {t('app.taskTitle')}
              <span className="text-amber-400/90" aria-hidden>
                {' '}
                *
              </span>
            </span>
            <span className="font-normal text-zinc-600">
              {snap.title.length}/{MAX_TASK_TITLE_CHARS}
            </span>
          </span>
          <input
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
            value={snap.title}
            disabled={!canEdit}
            onChange={(e) =>
              setSnap((s) => ({ ...s, title: sanitizeTaskTitleInput(e.target.value) }))
            }
          />
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

        <label className="mt-4 flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.group')}</span>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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

        <label className="mt-4 flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.priorityShort')}</span>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.scheduleSection')}</legend>
          {!snap.backlogOnly ? (
            <LocalDatePickerField
              label={t('app.plannedDate')}
              value={snap.scheduledLocalDate}
              onChange={(v) =>
                setSnap((s) => ({
                  ...s,
                  scheduledLocalDate: v,
                  anchorLocalDate:
                    s.recurrenceKind !== 'none'
                      ? v || s.anchorLocalDate
                      : s.anchorLocalDate,
                }))
              }
              disabled={!canEdit}
            />
          ) : null}
          <label
            className={`flex cursor-pointer items-center gap-2 text-xs text-zinc-400 ${snap.backlogOnly ? 'mt-2' : 'mt-3'}`}
          >
            <input
              type="checkbox"
              checked={snap.backlogOnly}
              disabled={!canEdit}
              onChange={(e) =>
                setSnap((s) => ({
                  ...s,
                  backlogOnly: e.target.checked,
                  scheduledLocalDate: e.target.checked ? null : selectedDayKey,
                }))
              }
            />
            {t('app.addToBacklog')}
          </label>
        </fieldset>

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.recurrenceSection')}</legend>
          <select
            className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.everyNDaysLabel')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
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
                  className={`rounded border px-2 py-1 text-[11px] disabled:opacity-40 ${
                    snap.weekdays.includes(d)
                      ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
                      : 'border-zinc-700 text-zinc-500'
                  }`}
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
                onChange={(v) =>
                  setSnap((s) => ({
                    ...s,
                    anchorLocalDate: v ?? s.scheduledLocalDate ?? selectedDayKey,
                  }))
                }
                disabled={!canEdit}
              />
            </div>
          ) : null}
        </fieldset>

        <div className="mt-4 flex flex-col gap-2">
          <span className="text-xs text-zinc-500">
            {t('app.estimatedTimeSection')}
            {plannedWithEstimateRequired ? (
              <span className="text-amber-400/90" aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </span>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[6rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.estimatedHours')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-white disabled:opacity-40"
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
            <label className="flex min-w-[6rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.estimatedMinutesPart')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-white disabled:opacity-40"
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
          <p className="text-[10px] leading-snug text-zinc-600">{t('app.estimateHint')}</p>
          {floatingEstimateWarning ? (
            <p className="text-[11px] leading-snug text-amber-400/90">{floatingEstimateWarning}</p>
          ) : null}
        </div>

        <TaskTimeAccordion
          timeMode={snap.timeMode}
          timeClock={snap.timeMode === 'none' ? '' : snap.timeClock}
          canEdit={canEdit}
          radioName="createtimemode"
          onModeNone={() => setSnap((s) => ({ ...s, timeMode: 'none', timeClock: '' }))}
          onModeStart={() =>
            setSnap((s) => ({
              ...s,
              timeMode: 'start',
              timeClock: s.timeClock || minutesToTimeInput(9 * 60),
            }))
          }
          onModeEnd={() =>
            setSnap((s) => ({
              ...s,
              timeMode: 'end',
              timeClock: s.timeClock || minutesToTimeInput(18 * 60),
            }))
          }
          onClockChange={(value) => setSnap((s) => ({ ...s, timeClock: value }))}
        />

        <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-4">
          {scheduleValidationError || anchorValidationError || estimateError ? (
            <p className="text-xs text-red-400" role="alert">
              {scheduleValidationError ?? anchorValidationError ?? estimateError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              !canEdit ||
              !snap.title.trim() ||
              estimateBlocked ||
              !!scheduleValidationError ||
              !!anchorValidationError
            }
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-500 disabled:opacity-40"
            onClick={() => void handleSave()}
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
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
            role="alertdialog"
            aria-modal
            aria-labelledby="create-task-close-title"
            className="w-full max-w-sm rounded-xl border border-zinc-600 bg-zinc-950 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-task-close-title" className="text-sm font-semibold text-zinc-100">
              {t('app.createTaskCloseTitle')}
            </h3>
            <p className="mt-2 text-sm leading-snug text-zinc-400">{closeConfirmHint}</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                onClick={() => setCloseConfirmOpen(false)}
              >
                {t('app.createTaskCloseStay')}
              </button>
              <button
                type="button"
                className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
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
