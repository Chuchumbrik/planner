import { useEffect, useState } from 'react'
import { mergeEstimateParts, splitEstimateMinutes } from '@/lib/estimateInput'
import { useTranslation } from 'react-i18next'
import { ColorPalette } from '@/components/ColorPalette'
import { LocalDatePickerField } from '@/components/LocalDatePickerField'
import { parseLocalDateKey } from '@/lib/localDate'
import type {
  PriorityLabels,
  RecurrenceRule,
  Task,
  TaskColorKey,
  TaskTimeMode,
} from '@/vault/types'
import { PRIORITY_RANKS } from '@/vault/types'

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
}

export function TaskEditModal({
  task,
  groups,
  priorityLabels,
  selectedDayKey,
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
}: Props) {
  const { t } = useTranslation()
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [checkDraft, setCheckDraft] = useState('')
  const [estHoursDraft, setEstHoursDraft] = useState('')
  const [estMinutesDraft, setEstMinutesDraft] = useState('')
  const [estFieldError, setEstFieldError] = useState<string | null>(null)
  const [timeDraft, setTimeDraft] = useState(
    task.timeMinutesFromMidnight != null
      ? minutesToTimeInput(task.timeMinutesFromMidnight)
      : '',
  )

  const [everyNDaysDraft, setEveryNDaysDraft] = useState(
    task.recurrence?.kind === 'everyNDays' ? task.recurrence.n : 2,
  )

  useEffect(() => {
    if (task.recurrence?.kind === 'everyNDays') setEveryNDaysDraft(task.recurrence.n)
  }, [task])

  useEffect(() => {
    const p = splitEstimateMinutes(task.estimatedMinutes)
    setEstHoursDraft(p.hours)
    setEstMinutesDraft(p.minutes)
    setEstFieldError(null)
  }, [task.id, task.estimatedMinutes])

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder)

  const anchorBase =
    task.recurrenceAnchorLocalDate ?? task.scheduledLocalDate ?? selectedDayKey

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
    else setTitleDraft(task.title)
  }

  function commitEstimate() {
    const r = mergeEstimateParts(estHoursDraft, estMinutesDraft)
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
    setEstFieldError(null)
    void onSetEstimatedMinutes(r.total)
  }

  function applyTime(mode: TaskTimeMode) {
    if (mode === 'none') {
      void onSetTimePlan('none', null)
      setTimeDraft('')
      return
    }
    let m = timeInputToMinutes(timeDraft)
    if (m == null) {
      m = 9 * 60
      setTimeDraft(minutesToTimeInput(m))
    }
    void onSetTimePlan(mode, m)
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
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
          <span>{t('app.taskTitle')}</span>
          <input
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
            value={titleDraft}
            disabled={!canEdit}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => handleBlurTitle()}
          />
        </label>

        <div className="mt-4">
          <ColorPalette
            label={t('app.color')}
            value={task.colorKey}
            canEdit={canEdit}
            onChange={onSetColor}
          />
        </div>

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

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.scheduleSection')}</legend>
          <LocalDatePickerField
            label={t('app.plannedDate')}
            value={task.scheduledLocalDate}
            onChange={(v) => void onSetScheduledLocalDate(v)}
            disabled={!canEdit}
            allowClear
          />
          <p className="mt-2 text-xs text-zinc-600">{t('app.backlogHint')}</p>
          <button
            type="button"
            disabled={!canEdit}
            className="mt-2 rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            onClick={() => void onSetScheduledLocalDate(null)}
          >
            {t('app.moveToBacklog')}
          </button>
          <button
            type="button"
            disabled={!canEdit}
            className="mt-2 ml-2 rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            onClick={() => void onSetScheduledLocalDate(selectedDayKey)}
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
                type="number"
                min={1}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
                value={everyNDaysDraft}
                disabled={!canEdit}
                onChange={(e) => {
                  const n = Math.max(1, Number(e.target.value) || 1)
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
                  void onApplyTaskPatch({
                    recurrenceAnchorLocalDate: v || null,
                  })
                }}
                disabled={!canEdit}
              />
            </div>
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
                onChange={(e) => setEstHoursDraft(e.target.value)}
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
                onChange={(e) => setEstMinutesDraft(e.target.value)}
                onBlur={() => commitEstimate()}
              />
            </label>
          </div>
          {estFieldError ? <p className="text-xs text-red-400">{estFieldError}</p> : null}
          <p className="text-[10px] leading-snug text-zinc-600">{t('app.estimateHint')}</p>
        </div>

        <fieldset className="mt-4 rounded-lg border border-zinc-800 p-3">
          <legend className="px-1 text-xs text-zinc-500">{t('app.timeSection')}</legend>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="radio"
                name="timemode"
                checked={task.timeMode === 'none'}
                disabled={!canEdit}
                onChange={() => {
                  void onSetTimePlan('none', null)
                  setTimeDraft('')
                }}
              />
              {t('app.timeNone')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="radio"
                name="timemode"
                checked={task.timeMode === 'start'}
                disabled={!canEdit}
                onChange={() => applyTime('start')}
              />
              {t('app.timeStart')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="radio"
                name="timemode"
                checked={task.timeMode === 'end'}
                disabled={!canEdit}
                onChange={() => applyTime('end')}
              />
              {t('app.timeEnd')}
            </label>
          </div>
          <label className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.timeClock')}</span>
            <input
              type="time"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-white disabled:opacity-40"
              disabled={!canEdit || task.timeMode === 'none'}
              value={
                task.timeMode === 'none'
                  ? ''
                  : timeDraft ||
                    (task.timeMinutesFromMidnight != null
                      ? minutesToTimeInput(task.timeMinutesFromMidnight)
                      : '')
              }
              onChange={(e) => setTimeDraft(e.target.value)}
              onBlur={() => {
                if (task.timeMode !== 'none') applyTime(task.timeMode)
              }}
            />
          </label>
        </fieldset>

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
              onChange={(e) => setCheckDraft(e.target.value)}
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

        <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
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
  )
}
