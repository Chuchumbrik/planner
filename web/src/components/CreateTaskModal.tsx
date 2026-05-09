import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalDatePickerField } from '@/components/LocalDatePickerField'
import {
  TASK_COLOR_HEX,
  TASK_COLOR_KEYS,
  nearestTaskColorKey,
  parseColorInput,
} from '@/vault/colors'
import type {
  CreateTaskInput,
  PriorityLabels,
  RecurrenceRule,
  TaskColorKey,
  TaskDraft,
  TaskGroup,
  TaskTimeMode,
} from '@/vault/types'
import { DEFAULT_GROUP_ID, PRIORITY_RANKS } from '@/vault/types'

function minutesToTimeInput(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function timeInputToMinutes(v: string): number | null {
  if (!v.trim()) return null
  const [hs, ms] = v.split(':')
  const h = Number(hs)
  const min = Number(ms)
  if (Number.isNaN(h) || Number.isNaN(min)) return null
  const total = h * 60 + min
  if (total < 0 || total > 1439) return null
  return total
}

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
  estimatedMinutes: string
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
    estimatedMinutes: d.estimatedMinutes != null ? String(d.estimatedMinutes) : '',
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
    estimatedMinutes: '',
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

  const [snap, setSnap] = useState<Snapshot>(() =>
    emptySnapshot(selectedDayKey, defaultGroupId),
  )

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups])

  const colorPickerValue = useMemo(() => {
    const rgb = parseColorInput(snap.colorHexInput)
    if (rgb) {
      const h = (n: number) => n.toString(16).padStart(2, '0')
      return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`
    }
    return TASK_COLOR_HEX[snap.colorKey]
  }, [snap.colorHexInput, snap.colorKey])

  useEffect(() => {
    if (!open) return
    savedRef.current = false
    draftIdRef.current = resumeDraft?.id ?? null
    const base = resumeDraft
      ? snapshotFromDraft(resumeDraft, selectedDayKey)
      : emptySnapshot(selectedDayKey, defaultGroupId)
    initialRef.current = JSON.parse(JSON.stringify(base)) as Snapshot
    setSnap(base)
  }, [open, resumeDraft, selectedDayKey, defaultGroupId])

  const isDirty = useMemo(() => {
    const init = initialRef.current
    if (!init) return false
    return JSON.stringify(snap) !== JSON.stringify(init)
  }, [snap])

  function applyEst(): number | null {
    const v = snap.estimatedMinutes.trim()
    if (!v) return null
    const n = Number(v)
    if (Number.isNaN(n) || n <= 0) return null
    const e = Math.floor(n)
    if (e > 24 * 60) return null
    return e
  }

  function parseTimeForSubmit(): { mode: TaskTimeMode; minutes: number | null } {
    if (snap.timeMode === 'none') return { mode: 'none', minutes: null }
    let m = timeInputToMinutes(snap.timeClock)
    if (m == null) m = 9 * 60
    return { mode: snap.timeMode, minutes: m }
  }

  async function handleSave() {
    const trimmed = snap.title.trim()
    if (!trimmed || !canEdit) return

    const recurrence = buildRecurrenceRule(
      snap.recurrenceKind,
      snap.everyNDays,
      snap.weekdays,
    )
    let anchor = snap.anchorLocalDate.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) anchor = selectedDayKey

    const scheduled = snap.backlogOnly ? null : snap.scheduledLocalDate
    let anchorOut: string | null = recurrence ? anchor : null
    if (recurrence && !anchorOut) anchorOut = scheduled ?? selectedDayKey
    const recurrenceFinal = recurrence && anchorOut ? recurrence : null

    const tm = parseTimeForSubmit()
    const input: CreateTaskInput = {
      title: trimmed,
      groupId: sortedGroups.some((g) => g.id === snap.groupId) ? snap.groupId : DEFAULT_GROUP_ID,
      colorKey: snap.colorKey,
      priorityRank: PRIORITY_RANKS.includes(snap.priorityRank as (typeof PRIORITY_RANKS)[number])
        ? (snap.priorityRank as CreateTaskInput['priorityRank'])
        : 3,
      scheduledLocalDate: scheduled,
      estimatedMinutes: applyEst(),
      timeMode: tm.mode,
      timeMinutesFromMidnight: tm.minutes,
      recurrence: recurrenceFinal,
      recurrenceAnchorLocalDate: recurrenceFinal ? anchorOut : null,
    }

    savedRef.current = true
    await onSave(input, { removeDraftId: draftIdRef.current ?? undefined })
    onClose()
  }

  async function handleDismiss() {
    if (savedRef.current) {
      onClose()
      return
    }
    if (isDirty && canEdit) {
      const recurrence = buildRecurrenceRule(
        snap.recurrenceKind,
        snap.everyNDays,
        snap.weekdays,
      )
      let anchor = snap.anchorLocalDate.trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) anchor = selectedDayKey
      const scheduled = snap.backlogOnly ? null : snap.scheduledLocalDate
      let anchorOut: string | null = recurrence ? anchor : null
      if (recurrence && !anchorOut) anchorOut = scheduled ?? selectedDayKey
      const recurrenceFinal = recurrence && anchorOut ? recurrence : null

      const tm = parseTimeForSubmit()
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
        estimatedMinutes: applyEst(),
        timeMode: tm.mode,
        timeMinutesFromMidnight: tm.minutes,
        recurrence: recurrenceFinal,
        recurrenceAnchorLocalDate: recurrenceFinal ? anchorOut : null,
      }
      await onPersistDraft(draft)
    }
    onClose()
  }

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
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) void handleDismiss()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">{t('app.createTaskTitle')}</h2>
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300"
            onClick={() => void handleDismiss()}
          >
            ✕
          </button>
        </div>

        <label className="mt-3 flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.taskTitle')}</span>
          <input
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
            value={snap.title}
            disabled={!canEdit}
            onChange={(e) => setSnap((s) => ({ ...s, title: e.target.value }))}
          />
        </label>

        <div className="mt-4 space-y-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.color')}</span>
            <select
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
              value={snap.colorKey}
              disabled={!canEdit}
              onChange={(e) => {
                const key = e.target.value as TaskColorKey
                setSnap((s) => ({
                  ...s,
                  colorKey: key,
                  colorHexInput: TASK_COLOR_HEX[key],
                }))
              }}
            >
              {TASK_COLOR_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`app.colorName.${key}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.colorHexInput')}</span>
              <input
                type="text"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 disabled:opacity-40"
                placeholder="#RRGGBB · rgb(…)"
                value={snap.colorHexInput}
                disabled={!canEdit}
                onChange={(e) => {
                  const v = e.target.value
                  const rgb = parseColorInput(v)
                  setSnap((s) => ({
                    ...s,
                    colorHexInput: v,
                    colorKey: rgb ? nearestTaskColorKey(rgb) : s.colorKey,
                  }))
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              <span>{t('app.colorPickerNative')}</span>
              <input
                type="color"
                className="h-[38px] w-14 cursor-pointer rounded border border-zinc-700 bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                value={colorPickerValue}
                disabled={!canEdit}
                title={t('app.colorPickerNative')}
                onChange={(e) => {
                  const hex = e.target.value
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
            </label>
          </div>
          <p className="text-[10px] leading-snug text-zinc-600">
            {t('app.colorHexHint', { name: t(`app.colorName.${snap.colorKey}`) })}
          </p>
        </div>

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
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
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
          {!snap.backlogOnly ? (
            <div className="mt-2">
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
            </div>
          ) : null}
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
                type="number"
                min={1}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
                value={snap.everyNDays}
                disabled={!canEdit}
                onChange={(e) =>
                  setSnap((s) => ({
                    ...s,
                    everyNDays: Math.max(1, Number(e.target.value) || 1),
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

        <label className="mt-4 flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.estimatedMinutes')}</span>
          <input
            type="number"
            min={1}
            max={1440}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
            placeholder={t('app.estimatedPlaceholder')}
            value={snap.estimatedMinutes}
            disabled={!canEdit}
            onChange={(e) => setSnap((s) => ({ ...s, estimatedMinutes: e.target.value }))}
          />
        </label>

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.timeSection')}</legend>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="radio"
                name="createtimemode"
                checked={snap.timeMode === 'none'}
                disabled={!canEdit}
                onChange={() => setSnap((s) => ({ ...s, timeMode: 'none', timeClock: '' }))}
              />
              {t('app.timeNone')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="radio"
                name="createtimemode"
                checked={snap.timeMode === 'start'}
                disabled={!canEdit}
                onChange={() =>
                  setSnap((s) => ({
                    ...s,
                    timeMode: 'start',
                    timeClock: s.timeClock || minutesToTimeInput(9 * 60),
                  }))
                }
              />
              {t('app.timeStart')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="radio"
                name="createtimemode"
                checked={snap.timeMode === 'end'}
                disabled={!canEdit}
                onChange={() =>
                  setSnap((s) => ({
                    ...s,
                    timeMode: 'end',
                    timeClock: s.timeClock || minutesToTimeInput(18 * 60),
                  }))
                }
              />
              {t('app.timeEnd')}
            </label>
          </div>
          <label className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.timeClock')}</span>
            <input
              type="time"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
              disabled={!canEdit || snap.timeMode === 'none'}
              value={snap.timeMode === 'none' ? '' : snap.timeClock}
              onChange={(e) => setSnap((s) => ({ ...s, timeClock: e.target.value }))}
            />
          </label>
        </fieldset>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            disabled={!canEdit || !snap.title.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-500 disabled:opacity-40"
            onClick={() => void handleSave()}
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={() => void handleDismiss()}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
