/**
 * Чистые операции над VaultPayload (без React, Supabase, localStorage).
 * Используются VaultProvider и тесты; нативные клиенты могут портировать этот модуль 1:1.
 */

import {
  computeDoubleConfirmDeadlineIso,
  effectiveDoubleConfirmGraceMin,
  effectiveDoubleConfirmIntervalMin,
} from '../lib/doubleConfirm'
import { localDateKey, shiftLocalDateKey } from '../lib/localDate'
import { tasksScheduledForPlannerDay } from '../lib/eod/eodRitual'
import {
  DEFAULT_GROUP_ID,
  type CreateTaskInput,
  type EodPreferences,
  type PriorityRank,
  type Task,
  type TaskColorKey,
  type TaskDraft,
  type TaskGroup,
  type TaskTimeMode,
  type VaultPayload,
  type NotificationDeliveryMode,
} from '../vault/types'

/** Локальный календарный день задачи / вхождения повтора: YYYY-MM-DD */
export const LOCAL_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type VaultDeps = {
  newId: () => string
  nowIso: () => string
}

export function applyCreateTask(
  vault: VaultPayload,
  input: CreateTaskInput,
  deps: VaultDeps,
): VaultPayload {
  const trimmed = input.title.trim()
  if (!trimmed) return vault

  const base = vault
  const gid =
    input.groupId && base.groups.some((g) => g.id === input.groupId)
      ? input.groupId
      : DEFAULT_GROUP_ID

  let recurrence = input.recurrence
  let anchor = input.recurrenceAnchorLocalDate
  if (recurrence && !anchor) anchor = input.scheduledLocalDate
  if (recurrence && !anchor) recurrence = null
  if (!recurrence) anchor = null

  let timeMode = input.timeMode
  let timeMinutes = input.timeMinutesFromMidnight
  if (timeMode === 'none') timeMinutes = null
  if (timeMode !== 'none' && (timeMinutes == null || timeMinutes < 0 || timeMinutes > 1439)) {
    timeMode = 'none'
    timeMinutes = null
  }

  let est: number | null = input.estimatedMinutes
  if (est != null && (Number.isNaN(est) || est <= 0 || est > 24 * 60)) est = null

  const dc =
    input.doubleConfirmEnabled === true
      ? {
          doubleConfirmEnabled: true as const,
          doubleConfirmIntervalMinutes:
            typeof input.doubleConfirmIntervalMinutes === 'number' &&
            input.doubleConfirmIntervalMinutes >= 1 &&
            input.doubleConfirmIntervalMinutes <= 24 * 60
              ? Math.floor(input.doubleConfirmIntervalMinutes)
              : undefined,
          doubleConfirmGraceMinutes:
            typeof input.doubleConfirmGraceMinutes === 'number' &&
            input.doubleConfirmGraceMinutes >= 1 &&
            input.doubleConfirmGraceMinutes <= 24 * 60
              ? Math.floor(input.doubleConfirmGraceMinutes)
              : undefined,
        }
      : {}

  const task: Task = {
    id: deps.newId(),
    title: trimmed,
    done: false,
    createdAt: deps.nowIso(),
    updatedAt: deps.nowIso(),
    groupId: gid,
    colorKey: input.colorKey ?? 'zinc',
    checklist: [],
    priorityRank: input.priorityRank,
    scheduledLocalDate: input.scheduledLocalDate,
    estimatedMinutes: est,
    timeMode,
    timeMinutesFromMidnight: timeMinutes,
    recurrence,
    recurrenceAnchorLocalDate: anchor,
    completedOccurrenceLocalDates: [],
    includeInEodRitual: true,
    ...dc,
  }

  return {
    ...base,
    tasks: [task, ...base.tasks],
  }
}

export function applyUpsertDraft(vault: VaultPayload, draft: TaskDraft): VaultPayload {
  const rest = vault.drafts.filter((d) => d.id !== draft.id)
  const nextDrafts = [draft, ...rest].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  return { ...vault, drafts: nextDrafts }
}

export function applyDeleteDraft(vault: VaultPayload, draftId: string): VaultPayload {
  return {
    ...vault,
    drafts: vault.drafts.filter((d) => d.id !== draftId),
  }
}

export function applyToggleTask(
  vault: VaultPayload,
  taskId: string,
  occurrenceDayKey: string | undefined,
  deps: VaultDeps,
): VaultPayload {
  const dayOk =
    typeof occurrenceDayKey === 'string' && LOCAL_DATE_KEY_PATTERN.test(occurrenceDayKey)

  const t = vault.tasks.find((x) => x.id === taskId)
  if (!t) return vault
  const now = deps.nowIso()
  const nowMs = Date.parse(now)
  const todayKey = localDateKey(new Date(nowMs))
  /** Закрывать/открывать выполнение можно только для календарного «сегодня» (локально). */
  if (!dayOk || !occurrenceDayKey || occurrenceDayKey !== todayKey) return vault

  if (t.recurrence) {
    const prevDates = t.completedOccurrenceLocalDates ?? []
    const wasDone = prevDates.includes(occurrenceDayKey)
    const wantDone = !wasDone

    if (!wantDone) {
      const nextDates = prevDates.filter((d) => d !== occurrenceDayKey)
      const clearPend =
        t.doubleConfirmPending?.localDate === occurrenceDayKey ? undefined : t.doubleConfirmPending
      return {
        ...vault,
        tasks: vault.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completedOccurrenceLocalDates: nextDates,
                doubleConfirmPending: clearPend ?? undefined,
                updatedAt: now,
              }
            : task,
        ),
      }
    }

    if (wantDone && t.checklist.length > 0 && t.checklist.some((s) => !s.done)) {
      return vault
    }

    if (!t.doubleConfirmEnabled) {
      const nextDates = [...new Set([...prevDates, occurrenceDayKey])].sort()
      return {
        ...vault,
        tasks: vault.tasks.map((task) =>
          task.id === taskId
            ? { ...task, completedOccurrenceLocalDates: nextDates, updatedAt: now }
            : task,
        ),
      }
    }

    const pend = t.doubleConfirmPending
    const intervalMin = effectiveDoubleConfirmIntervalMin(t)
    const graceMin = effectiveDoubleConfirmGraceMin(t)

    if (pend && pend.localDate === occurrenceDayKey) {
      if (nowMs <= Date.parse(pend.confirmDeadlineIso)) {
        const nextDates = [...new Set([...prevDates, occurrenceDayKey])].sort()
        return {
          ...vault,
          tasks: vault.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completedOccurrenceLocalDates: nextDates,
                  doubleConfirmPending: undefined,
                  updatedAt: now,
                }
              : task,
          ),
        }
      }
    }

    const deadlineIso = computeDoubleConfirmDeadlineIso(now, intervalMin, graceMin)
    return {
      ...vault,
      tasks: vault.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              doubleConfirmPending: {
                localDate: occurrenceDayKey,
                firstStepAtIso: now,
                confirmDeadlineIso: deadlineIso,
              },
              updatedAt: now,
            }
          : task,
      ),
    }
  }

  const prevDone = t.done
  const wantDone = !prevDone

  if (!wantDone) {
    return {
      ...vault,
      tasks: vault.tasks.map((task) =>
        task.id === taskId
          ? { ...task, done: false, doubleConfirmPending: undefined, updatedAt: now }
          : task,
      ),
    }
  }

  if (wantDone && t.checklist.length > 0 && t.checklist.some((s) => !s.done)) {
    return vault
  }

  if (!t.doubleConfirmEnabled) {
    return {
      ...vault,
      tasks: vault.tasks.map((task) =>
        task.id === taskId ? { ...task, done: true, updatedAt: now } : task,
      ),
    }
  }

  const pend = t.doubleConfirmPending
  const intervalMin = effectiveDoubleConfirmIntervalMin(t)
  const graceMin = effectiveDoubleConfirmGraceMin(t)

  if (pend && pend.localDate === occurrenceDayKey) {
    if (nowMs <= Date.parse(pend.confirmDeadlineIso)) {
      return {
        ...vault,
        tasks: vault.tasks.map((task) =>
          task.id === taskId
            ? { ...task, done: true, doubleConfirmPending: undefined, updatedAt: now }
            : task,
        ),
      }
    }
  }

  const deadlineIso = computeDoubleConfirmDeadlineIso(now, intervalMin, graceMin)
  return {
    ...vault,
    tasks: vault.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            doubleConfirmPending: {
              localDate: occurrenceDayKey,
              firstStepAtIso: now,
              confirmDeadlineIso: deadlineIso,
            },
            updatedAt: now,
          }
        : task,
    ),
  }
}

/** DR-004: снять просроченное ожидание второго шага (без записи «выполнено»). */
export function applyExpireStaleDoubleConfirm(vault: VaultPayload, deps: VaultDeps): VaultPayload {
  const nowMs = Date.parse(deps.nowIso())
  let changed = false
  const tasks = vault.tasks.map((t) => {
    const p = t.doubleConfirmPending
    if (!p) return t
    if (nowMs <= Date.parse(p.confirmDeadlineIso)) return t
    changed = true
    return { ...t, doubleConfirmPending: undefined, updatedAt: deps.nowIso() }
  })
  if (!changed) return vault
  return { ...vault, tasks }
}

export function applyRemoveTask(vault: VaultPayload, id: string): VaultPayload {
  return {
    ...vault,
    tasks: vault.tasks.filter((t) => t.id !== id),
  }
}

/** Убрать одно вхождение повторяющейся задачи из плана на локальный день (серия сохраняется). */
export function applySkipTaskOccurrenceForDay(
  vault: VaultPayload,
  taskId: string,
  dateKey: string,
  deps: VaultDeps,
): VaultPayload {
  if (!LOCAL_DATE_KEY_PATTERN.test(dateKey)) return vault
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) => {
      if (t.id !== taskId || !t.recurrence) return t
      const prev = t.skippedOccurrenceLocalDates ?? []
      if (prev.includes(dateKey)) return t
      const next = [...new Set([...prev, dateKey])].sort()
      const completed = (t.completedOccurrenceLocalDates ?? []).filter((d) => d !== dateKey)
      return {
        ...t,
        skippedOccurrenceLocalDates: next,
        completedOccurrenceLocalDates: completed,
        updatedAt: now,
      }
    }),
  }
}

export function applySetTaskColor(
  vault: VaultPayload,
  taskId: string,
  colorKey: TaskColorKey,
  deps: VaultDeps,
): VaultPayload {
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) =>
      t.id === taskId ? { ...t, colorKey, updatedAt: now } : t,
    ),
  }
}

export function applySetTaskGroup(
  vault: VaultPayload,
  taskId: string,
  groupId: string,
  deps: VaultDeps,
): VaultPayload {
  if (!vault.groups.some((g) => g.id === groupId)) return vault
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) =>
      t.id === taskId ? { ...t, groupId, updatedAt: now } : t,
    ),
  }
}

export function applyAddChecklistItem(
  vault: VaultPayload,
  taskId: string,
  title: string,
  deps: VaultDeps,
): VaultPayload {
  const trimmed = title.trim()
  if (!trimmed) return vault
  const now = deps.nowIso()
  const sub = {
    id: deps.newId(),
    title: trimmed,
    done: false,
    createdAt: now,
    updatedAt: now,
  }
  return {
    ...vault,
    tasks: vault.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            updatedAt: now,
            checklist: [...t.checklist, sub],
          }
        : t,
    ),
  }
}

export function applyToggleChecklistItem(
  vault: VaultPayload,
  taskId: string,
  itemId: string,
  deps: VaultDeps,
  /** Календарный день контекста UI (выбранный день / колонка недели); отметки пунктов — только если это локальное «сегодня». */
  contextLocalDateKey: string | undefined,
): VaultPayload {
  const now = deps.nowIso()
  const nowMs = Date.parse(now)
  const todayKey = localDateKey(new Date(nowMs))
  const dayOk =
    typeof contextLocalDateKey === 'string' && LOCAL_DATE_KEY_PATTERN.test(contextLocalDateKey)
  /** Согласовано с `applyToggleTask`: менять «выполнено» по чек-листу можно только в календарный сегодня. */
  if (!dayOk || !contextLocalDateKey || contextLocalDateKey !== todayKey) return vault

  return {
    ...vault,
    tasks: vault.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            updatedAt: now,
            checklist: t.checklist.map((s) =>
              s.id === itemId ? { ...s, done: !s.done, updatedAt: now } : s,
            ),
          }
        : t,
    ),
  }
}

export function applyRemoveChecklistItem(
  vault: VaultPayload,
  taskId: string,
  itemId: string,
): VaultPayload {
  return {
    ...vault,
    tasks: vault.tasks.map((t) =>
      t.id === taskId
        ? { ...t, checklist: t.checklist.filter((s) => s.id !== itemId) }
        : t,
    ),
  }
}

export function applyAddGroup(vault: VaultPayload, name: string, deps: VaultDeps): VaultPayload {
  const trimmed = name.trim()
  if (!trimmed) return vault
  const maxOrder = vault.groups.reduce((m, g) => Math.max(m, g.sortOrder), 0)
  const g: TaskGroup = {
    id: deps.newId(),
    name: trimmed,
    sortOrder: maxOrder + 1,
  }
  return { ...vault, groups: [...vault.groups, g] }
}

export function applyRenameGroup(vault: VaultPayload, groupId: string, name: string): VaultPayload {
  const trimmed = name.trim()
  if (!trimmed) return vault
  return {
    ...vault,
    groups: vault.groups.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g)),
  }
}

export function applyDeleteGroup(vault: VaultPayload, groupId: string): VaultPayload {
  if (groupId === DEFAULT_GROUP_ID) return vault
  return {
    ...vault,
    groups: vault.groups.filter((g) => g.id !== groupId),
    tasks: vault.tasks.map((t) =>
      t.groupId === groupId ? { ...t, groupId: DEFAULT_GROUP_ID } : t,
    ),
  }
}

export function applySetPriorityLabel(
  vault: VaultPayload,
  rank: PriorityRank,
  label: string,
): VaultPayload {
  const trimmed = label.trim()
  if (!trimmed) return vault
  return {
    ...vault,
    priorityLabels: { ...vault.priorityLabels, [rank]: trimmed },
  }
}

export function applySetTaskPriorityRank(
  vault: VaultPayload,
  taskId: string,
  rank: PriorityRank,
  deps: VaultDeps,
): VaultPayload {
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) =>
      t.id === taskId ? { ...t, priorityRank: rank, updatedAt: now } : t,
    ),
  }
}

export function applySetTaskScheduledLocalDate(
  vault: VaultPayload,
  taskId: string,
  date: string | null,
  deps: VaultDeps,
): VaultPayload {
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) =>
      t.id === taskId ? { ...t, scheduledLocalDate: date, updatedAt: now } : t,
    ),
  }
}

export function applySetTaskEstimatedMinutes(
  vault: VaultPayload,
  taskId: string,
  minutes: number | null,
  deps: VaultDeps,
): VaultPayload {
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) => {
      if (t.id !== taskId) return t
      let est: number | null = null
      if (minutes != null && !Number.isNaN(minutes)) {
        const e = Math.floor(minutes)
        if (e > 0 && e <= 24 * 60) est = e
      }
      return { ...t, estimatedMinutes: est, updatedAt: now }
    }),
  }
}

export function applySetTaskTimePlan(
  vault: VaultPayload,
  taskId: string,
  mode: TaskTimeMode,
  minutesFromMidnight: number | null,
  deps: VaultDeps,
): VaultPayload {
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) => {
      if (t.id !== taskId) return t
      if (mode === 'none') {
        return {
          ...t,
          timeMode: 'none' as const,
          timeMinutesFromMidnight: null,
          updatedAt: now,
        }
      }
      const m =
        minutesFromMidnight != null &&
        !Number.isNaN(minutesFromMidnight) &&
        minutesFromMidnight >= 0 &&
        minutesFromMidnight <= 1439
          ? Math.floor(minutesFromMidnight)
          : null
      return {
        ...t,
        timeMode: mode,
        timeMinutesFromMidnight: m,
        updatedAt: now,
      }
    }),
  }
}

export function applyCompleteEodForLocalDate(vault: VaultPayload, dateKey: string): VaultPayload {
  if (!LOCAL_DATE_KEY_PATTERN.test(dateKey)) return vault
  const prev = vault.eodCompletedLocalDates ?? []
  const next = [...new Set([...prev, dateKey])].sort()
  return { ...vault, eodCompletedLocalDates: next }
}

function mergeEodPreferences(prev: VaultPayload['eodPreferences'] | undefined): EodPreferences {
  const raw = prev && typeof prev === 'object' ? prev : {}
  const p = raw as Partial<EodPreferences>
  let pushReminder: number | undefined
  if (typeof p.pushReminderMinutesFromMidnight === 'number' && Number.isFinite(p.pushReminderMinutesFromMidnight)) {
    const r = Math.round(p.pushReminderMinutesFromMidnight)
    if (r >= 0 && r <= 1439) pushReminder = r
  }
  return {
    enabled: p.enabled !== false,
    autoCloseAtDayEnd: p.autoCloseAtDayEnd === true,
    ...(pushReminder !== undefined ? { pushReminderMinutesFromMidnight: pushReminder } : {}),
  }
}

export function applySetEodEnabled(vault: VaultPayload, enabled: boolean): VaultPayload {
  const m = mergeEodPreferences(vault.eodPreferences)
  return {
    ...vault,
    eodPreferences: { ...m, enabled },
  }
}

export function applySetEodAutoCloseAtDayEnd(vault: VaultPayload, value: boolean): VaultPayload {
  const m = mergeEodPreferences(vault.eodPreferences)
  return {
    ...vault,
    eodPreferences: { ...m, autoCloseAtDayEnd: value },
  }
}

/** `minutes === null` — убрать напоминание EOD по push. */
export function applySetEodPushReminderMinutes(vault: VaultPayload, minutes: number | null): VaultPayload {
  const m = mergeEodPreferences(vault.eodPreferences)
  if (minutes === null) {
    return {
      ...vault,
      eodPreferences: {
        enabled: m.enabled,
        autoCloseAtDayEnd: m.autoCloseAtDayEnd,
      },
    }
  }
  const r = Math.round(minutes)
  if (!Number.isFinite(r) || r < 0 || r > 1439) return vault
  return {
    ...vault,
    eodPreferences: {
      enabled: m.enabled,
      autoCloseAtDayEnd: m.autoCloseAtDayEnd,
      pushReminderMinutesFromMidnight: r,
    },
  }
}

export function applySetNotificationDeliveryMode(
  vault: VaultPayload,
  mode: NotificationDeliveryMode,
): VaultPayload {
  return {
    ...vault,
    notificationPreferences: { deliveryMode: mode },
  }
}

/**
 * Для прошлых локальных дней, в которых был план (`tasksScheduledForPlannerDay` не пуст),
 * добавляет дату в `eodCompletedLocalDates`, если включены EOD и `autoCloseAtDayEnd`.
 * Ограничение по глубине — защита от бесконечного цикла при повреждённой дате.
 */
export function applyAutoCompleteEodForElapsedPlannerDays(
  vault: VaultPayload,
  todayKey: string,
  opts?: { maxPastDays?: number },
): VaultPayload {
  if (!LOCAL_DATE_KEY_PATTERN.test(todayKey)) return vault
  const m = mergeEodPreferences(vault.eodPreferences)
  if (!m.enabled || !m.autoCloseAtDayEnd) return vault

  const maxPast = Math.min(800, Math.max(1, opts?.maxPastDays ?? 400))
  const prev = vault.eodCompletedLocalDates ?? []
  const done = new Set(prev)
  const toAdd: string[] = []

  for (let i = 1; i <= maxPast; i++) {
    const d = shiftLocalDateKey(todayKey, -i)
    if (!LOCAL_DATE_KEY_PATTERN.test(d)) break
    if (d >= todayKey) break
    if (done.has(d)) continue
    if (tasksScheduledForPlannerDay(vault.tasks, d).length === 0) continue
    toAdd.push(d)
    done.add(d)
  }

  if (toAdd.length === 0) return vault
  const next = [...new Set([...prev, ...toAdd])].sort()
  return { ...vault, eodCompletedLocalDates: next }
}

export function applyPatchTask(
  vault: VaultPayload,
  taskId: string,
  patch: Partial<Task>,
  deps: VaultDeps,
): VaultPayload {
  const now = deps.nowIso()
  return {
    ...vault,
    tasks: vault.tasks.map((t) => {
      if (t.id !== taskId) return t
      const merged: Task = { ...t, ...patch, updatedAt: now }

      if ('doubleConfirmEnabled' in patch && patch.doubleConfirmEnabled === false) {
        merged.doubleConfirmPending = undefined
      }

      if (patch.recurrence === null) {
        merged.completedOccurrenceLocalDates = []
        return merged
      }

      if (!merged.recurrence) return merged

      const ruleChanged =
        'recurrence' in patch &&
        patch.recurrence !== undefined &&
        JSON.stringify(patch.recurrence) !== JSON.stringify(t.recurrence)
      const anchorChanged =
        'recurrenceAnchorLocalDate' in patch &&
        patch.recurrenceAnchorLocalDate !== t.recurrenceAnchorLocalDate

      if (ruleChanged || anchorChanged) {
        merged.completedOccurrenceLocalDates = []
      }

      return merged
    }),
  }
}
