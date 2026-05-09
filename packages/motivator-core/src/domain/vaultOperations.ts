/**
 * Чистые операции над VaultPayload (без React, Supabase, localStorage).
 * Используются VaultProvider и тесты; нативные клиенты могут портировать этот модуль 1:1.
 */

import {
  DEFAULT_GROUP_ID,
  type CreateTaskInput,
  type PriorityRank,
  type Task,
  type TaskColorKey,
  type TaskDraft,
  type TaskGroup,
  type TaskTimeMode,
  type VaultPayload,
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

  if (t.recurrence) {
    if (!dayOk || !occurrenceDayKey) return vault
    const prevDates = t.completedOccurrenceLocalDates ?? []
    const wasDone = prevDates.includes(occurrenceDayKey)
    const nextDone = !wasDone
    if (nextDone && t.checklist.length > 0 && t.checklist.some((s) => !s.done)) {
      return vault
    }
    const nextDates = nextDone
      ? [...new Set([...prevDates, occurrenceDayKey])].sort()
      : prevDates.filter((d) => d !== occurrenceDayKey)
    return {
      ...vault,
      tasks: vault.tasks.map((task) =>
        task.id === taskId
          ? { ...task, completedOccurrenceLocalDates: nextDates, updatedAt: now }
          : task,
      ),
    }
  }

  const nextDone = !t.done
  if (nextDone && t.checklist.length > 0 && t.checklist.some((s) => !s.done)) {
    return vault
  }
  return {
    ...vault,
    tasks: vault.tasks.map((task) =>
      task.id === taskId ? { ...task, done: nextDone, updatedAt: now } : task,
    ),
  }
}

export function applyRemoveTask(vault: VaultPayload, id: string): VaultPayload {
  return {
    ...vault,
    tasks: vault.tasks.filter((t) => t.id !== id),
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
            checklist: [sub, ...t.checklist],
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
): VaultPayload {
  const now = deps.nowIso()
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
