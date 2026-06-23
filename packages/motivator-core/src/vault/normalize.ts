import { normalizeWeekdays } from '../lib/recurrence'
import {
  DEFAULT_GROUP_ID,
  defaultPriorityLabels,
  emptyVault,
  type ChecklistItem,
  type EisenhowerQuadrant,
  type PriorityLabels,
  type PriorityRank,
  type PrioritySystem,
  type RecurrenceRule,
  type Task,
  type TaskColorKey,
  type TaskDraft,
  type TaskTimeMode,
  type TaskV2Stored,
  type TaskV3,
  type VaultPayloadV1,
  type VaultPayloadV2,
  type VaultPayloadV3,
  type VaultPayloadV4,
  type VaultPayloadV5,
  type VaultPayloadV6,
  type VaultPayloadV7,
  type VaultPayloadV8,
  type VaultPayloadV9,
  type TaskGroup,
  type TaskGroupV8,
  type NotificationPreferences,
  type EodPreferences,
} from './types'
import { groupColorForSortOrder } from './colors'

function isColorKey(x: unknown): x is TaskColorKey {
  return (
    typeof x === 'string' &&
    ['zinc', 'red', 'orange', 'amber', 'emerald', 'sky', 'violet', 'pink'].includes(x)
  )
}

/** Дефолтная группа для легаси-repair (V2–V8, без цвета). */
function LEGACY_DEFAULT_GROUPS(): TaskGroupV8[] {
  return [{ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 }]
}

function normalizePrioritySystem(x: unknown): PrioritySystem {
  return x === 'eisenhower' ? 'eisenhower' : 'levels'
}

function normalizeQuadrant(q: unknown): EisenhowerQuadrant | null {
  if (q === null || q === undefined) return null
  if (q === 'q1' || q === 'q2' || q === 'q3' || q === 'q4') return q
  return null
}

function isPriorityRank(x: unknown): x is PriorityRank {
  return x === 1 || x === 2 || x === 3 || x === 4 || x === 5
}

function isTaskTimeMode(x: unknown): x is TaskTimeMode {
  return x === 'none' || x === 'start' || x === 'end'
}

function clampMinutes(m: number | null | undefined): number | null {
  if (m == null || Number.isNaN(m)) return null
  const n = Math.floor(m)
  if (n < 0 || n > 1439) return null
  return n
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function normalizeCompletedOccurrenceDates(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const x of raw) {
    if (typeof x === 'string' && DATE_KEY.test(x)) out.push(x)
  }
  return [...new Set(out)].sort()
}

function normalizeEodCompletedDates(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const x of raw) {
    if (typeof x === 'string' && DATE_KEY.test(x)) out.push(x)
  }
  return [...new Set(out)].sort()
}

function normalizeIncludeInEodRitual(raw: unknown): boolean {
  return raw !== false
}

function normalizePriorityLabels(raw: unknown): PriorityLabels {
  const base = defaultPriorityLabels()
  if (!raw || typeof raw !== 'object') return base
  const o = raw as Record<string, unknown>
  const out = { ...base }
  for (const r of [1, 2, 3, 4, 5] as const) {
    const v = o[String(r)]
    if (typeof v === 'string' && v.trim()) out[r] = v.trim()
  }
  return out
}

function normalizeRecurrenceRule(raw: unknown): RecurrenceRule | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.kind === 'daily') return { kind: 'daily' }
  if (r.kind === 'everyNDays') {
    const n = typeof r.n === 'number' && !Number.isNaN(r.n) ? Math.max(1, Math.floor(r.n)) : 1
    return { kind: 'everyNDays', n }
  }
  if (r.kind === 'weekly') {
    const wdRaw = Array.isArray(r.weekdays) ? r.weekdays : []
    const wd = normalizeWeekdays(wdRaw.filter((x): x is number => typeof x === 'number'))
    if (wd.length === 0) return null
    return { kind: 'weekly', weekdays: wd }
  }
  return null
}

/** Приводит произвольный JSON к актуальной схеме v9 */
export function normalizeVault(raw: unknown): VaultPayloadV9 {
  if (!raw || typeof raw !== 'object') return emptyVault()
  const o = raw as Record<string, unknown>

  if (
    o.schemaVersion === 9 &&
    Array.isArray(o.tasks) &&
    Array.isArray(o.groups) &&
    Array.isArray(o.drafts)
  ) {
    return repairV9(o as VaultPayloadV9)
  }

  if (
    o.schemaVersion === 8 &&
    Array.isArray(o.tasks) &&
    Array.isArray(o.groups) &&
    Array.isArray(o.drafts)
  ) {
    return migrateV8toV9(repairV8(o as VaultPayloadV8))
  }

  if (
    o.schemaVersion === 7 &&
    Array.isArray(o.tasks) &&
    Array.isArray(o.groups) &&
    Array.isArray(o.drafts)
  ) {
    return migrateV8toV9(migrateV7toV8(repairV7(o as VaultPayloadV7)))
  }

  if (
    o.schemaVersion === 6 &&
    Array.isArray(o.tasks) &&
    Array.isArray(o.groups) &&
    Array.isArray(o.drafts)
  ) {
    return migrateV8toV9(migrateV7toV8(migrateV6toV7(repairV6(o as VaultPayloadV6))))
  }

  if (
    o.schemaVersion === 5 &&
    Array.isArray(o.tasks) &&
    Array.isArray(o.groups) &&
    Array.isArray(o.drafts)
  ) {
    return migrateV8toV9(
      migrateV7toV8(migrateV6toV7(repairV6(migrateV5toV6(repairV5(o as VaultPayloadV5))))),
    )
  }

  if (o.schemaVersion === 4 && Array.isArray(o.tasks) && Array.isArray(o.groups)) {
    return migrateV8toV9(
      migrateV7toV8(
        migrateV6toV7(repairV6(migrateV5toV6(migrateV4toV5(repairV4(o as VaultPayloadV4))))),
      ),
    )
  }

  if (o.schemaVersion === 3 && Array.isArray(o.tasks) && Array.isArray(o.groups)) {
    return migrateV8toV9(
      migrateV7toV8(
        migrateV6toV7(
          repairV6(migrateV5toV6(migrateV4toV5(migrateV3toV4(repairV3(o as VaultPayloadV3))))),
        ),
      ),
    )
  }

  if (o.schemaVersion === 2 && Array.isArray(o.tasks) && Array.isArray(o.groups)) {
    return migrateV8toV9(
      migrateV7toV8(
        migrateV6toV7(
          repairV6(
            migrateV5toV6(
              migrateV4toV5(migrateV3toV4(repairV3(migrateV2toV3(repairV2(o as VaultPayloadV2))))),
            ),
          ),
        ),
      ),
    )
  }

  if (o.schemaVersion === 1 && Array.isArray(o.tasks)) {
    return migrateV8toV9(
      migrateV7toV8(
        migrateV6toV7(
          repairV6(
            migrateV5toV6(
              migrateV4toV5(
                migrateV3toV4(repairV3(migrateV2toV3(repairV2(migrateV1(o as VaultPayloadV1))))),
              ),
            ),
          ),
        ),
      ),
    )
  }

  return emptyVault()
}

/** Цвет группы при миграции V8→V9: сохранить валидный, иначе детерминированно по sortOrder. */
function normalizeGroupColor(g: { sortOrder: number } & Record<string, unknown>): TaskGroup['colorKey'] {
  const raw = g.colorKey
  return isColorKey(raw) ? raw : groupColorForSortOrder(g.sortOrder)
}

function migrateV8toV9(v: VaultPayloadV8): VaultPayloadV9 {
  return {
    ...v,
    schemaVersion: 9,
    groups: v.groups.map((g) => ({
      ...g,
      colorKey: normalizeGroupColor(g as { sortOrder: number } & Record<string, unknown>),
    })),
  }
}

function repairV9(v: VaultPayloadV9): VaultPayloadV9 {
  const colorById = new Map<string, TaskGroup['colorKey']>()
  for (const g of Array.isArray(v.groups) ? v.groups : []) {
    if (g && typeof g === 'object' && isColorKey((g as Record<string, unknown>).colorKey)) {
      colorById.set((g as TaskGroup).id, (g as TaskGroup).colorKey)
    }
  }
  const repaired = repairV8({
    schemaVersion: 8,
    priorityLabels: v.priorityLabels,
    groups: (Array.isArray(v.groups) ? v.groups : []).map((g) => ({
      id: g.id,
      name: g.name,
      sortOrder: g.sortOrder,
    })),
    tasks: v.tasks,
    drafts: v.drafts,
    eodCompletedLocalDates: v.eodCompletedLocalDates,
    eodPreferences: v.eodPreferences,
    notificationPreferences: v.notificationPreferences,
  })
  return {
    ...repaired,
    schemaVersion: 9,
    groups: repaired.groups.map((g) => ({
      ...g,
      colorKey: colorById.get(g.id) ?? groupColorForSortOrder(g.sortOrder),
    })),
  }
}

function migrateV6toV7(v: VaultPayloadV6): VaultPayloadV7 {
  return {
    schemaVersion: 7,
    priorityLabels: v.priorityLabels,
    groups: v.groups,
    tasks: v.tasks.map((t) => normalizeDoubleConfirmFieldsOnTask(normalizeRecurrenceOccurrenceFieldsOnTask(t))),
    drafts: v.drafts,
    eodCompletedLocalDates: v.eodCompletedLocalDates,
    eodPreferences: v.eodPreferences,
  }
}

function normalizeNotificationPreferences(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object') return { deliveryMode: 'off' }
  const mode = (raw as Record<string, unknown>).deliveryMode
  if (mode === 'hybrid' || mode === 'full' || mode === 'off') {
    return { deliveryMode: mode }
  }
  return { deliveryMode: 'off' }
}

function migrateV7toV8(v: VaultPayloadV7): VaultPayloadV8 {
  return {
    ...v,
    schemaVersion: 8,
    notificationPreferences: { deliveryMode: 'off' },
  }
}

function repairV8(v: VaultPayloadV8): VaultPayloadV8 {
  const v7part: VaultPayloadV7 = {
    schemaVersion: 7,
    priorityLabels: v.priorityLabels,
    groups: v.groups,
    tasks: v.tasks,
    drafts: v.drafts,
    eodCompletedLocalDates: v.eodCompletedLocalDates,
    eodPreferences: v.eodPreferences,
  }
  const repaired7 = repairV7(v7part)
  return {
    ...repaired7,
    schemaVersion: 8,
    notificationPreferences: normalizeNotificationPreferences(v.notificationPreferences),
  }
}

function normalizeSkippedOccurrenceDates(raw: unknown): string[] {
  return normalizeCompletedOccurrenceDates(raw)
}

function normalizeRecurrenceOccurrenceFieldsOnTask(t: Task): Task {
  const skipped = t.recurrence
    ? normalizeSkippedOccurrenceDates(t.skippedOccurrenceLocalDates)
    : []
  const completed = t.recurrence
    ? normalizeCompletedOccurrenceDates(t.completedOccurrenceLocalDates)
    : []
  return {
    ...t,
    completedOccurrenceLocalDates: completed,
    skippedOccurrenceLocalDates: skipped.length > 0 ? skipped : undefined,
  }
}

function normalizeDoubleConfirmFieldsOnTask(t: Task): Task {
  if (t.doubleConfirmEnabled !== true) {
    return {
      ...t,
      doubleConfirmEnabled: undefined,
      doubleConfirmIntervalMinutes: undefined,
      doubleConfirmGraceMinutes: undefined,
      doubleConfirmPending: undefined,
    }
  }
  let interval = t.doubleConfirmIntervalMinutes
  let grace = t.doubleConfirmGraceMinutes
  if (typeof interval !== 'number' || interval < 1 || interval > 24 * 60) interval = undefined
  if (typeof grace !== 'number' || grace < 1 || grace > 24 * 60) grace = undefined

  let pend = t.doubleConfirmPending ?? undefined
  if (pend && typeof pend === 'object') {
    const ld = pend.localDate
    const fs = pend.firstStepAtIso
    const dl = pend.confirmDeadlineIso
    if (
      typeof ld !== 'string' ||
      !DATE_KEY.test(ld) ||
      typeof fs !== 'string' ||
      typeof dl !== 'string' ||
      Number.isNaN(Date.parse(fs)) ||
      Number.isNaN(Date.parse(dl)) ||
      Date.parse(dl) <= Date.parse(fs)
    ) {
      pend = undefined
    }
  } else pend = undefined

  return {
    ...t,
    doubleConfirmEnabled: true,
    doubleConfirmIntervalMinutes: interval,
    doubleConfirmGraceMinutes: grace,
    doubleConfirmPending: pend,
  }
}

function repairV7(v: VaultPayloadV7): VaultPayloadV7 {
  const asV6 = { ...v, schemaVersion: 6 as const } as VaultPayloadV6
  return migrateV6toV7(repairV6(asV6))
}

function migrateV5toV6(v: VaultPayloadV5): VaultPayloadV6 {
  const r = repairV5(v)
  return {
    schemaVersion: 6,
    priorityLabels: r.priorityLabels,
    groups: r.groups,
    tasks: r.tasks.map((t) => ({
      ...t,
      includeInEodRitual: normalizeIncludeInEodRitual(t.includeInEodRitual),
    })),
    drafts: r.drafts,
    eodCompletedLocalDates: [],
    eodPreferences: { enabled: true, autoCloseAtDayEnd: false },
  }
}

function repairV6(v: VaultPayloadV6): VaultPayloadV6 {
  const r5 = repairV5({
    schemaVersion: 5,
    priorityLabels: v.priorityLabels,
    groups: v.groups,
    tasks: v.tasks,
    drafts: v.drafts,
  })
  const eodOn =
    v.eodPreferences && typeof v.eodPreferences === 'object' && v.eodPreferences.enabled === false
      ? false
      : true
  const eodRaw = v.eodPreferences && typeof v.eodPreferences === 'object' ? v.eodPreferences : {}
  const autoClose =
    'autoCloseAtDayEnd' in eodRaw && (eodRaw as { autoCloseAtDayEnd?: unknown }).autoCloseAtDayEnd === true
  const rawRem = (eodRaw as { pushReminderMinutesFromMidnight?: unknown }).pushReminderMinutesFromMidnight
  let pushRem: number | undefined
  if (typeof rawRem === 'number' && Number.isFinite(rawRem)) {
    const r = Math.round(rawRem)
    if (r >= 0 && r <= 1439) pushRem = r
  }
  const eodPreferences: EodPreferences = { enabled: eodOn, autoCloseAtDayEnd: autoClose }
  if (pushRem !== undefined) eodPreferences.pushReminderMinutesFromMidnight = pushRem
  return {
    schemaVersion: 6,
    priorityLabels: r5.priorityLabels,
    groups: r5.groups,
    tasks: r5.tasks.map((t) => ({
      ...t,
      includeInEodRitual: normalizeIncludeInEodRitual(t.includeInEodRitual),
    })),
    drafts: r5.drafts,
    eodCompletedLocalDates: normalizeEodCompletedDates(v.eodCompletedLocalDates),
    eodPreferences,
  }
}

function migrateV4toV5(v: VaultPayloadV4): VaultPayloadV5 {
  const r = repairV4(v)
  return {
    schemaVersion: 5,
    priorityLabels: r.priorityLabels,
    groups: r.groups,
    tasks: r.tasks,
    drafts: [],
  }
}

function repairDraft(row: Record<string, unknown>, groups: { id: string }[]): TaskDraft | null {
  const gid =
    typeof row.groupId === 'string' && groups.some((g) => g.id === row.groupId)
      ? row.groupId
      : DEFAULT_GROUP_ID
  const scheduled =
    typeof row.scheduledLocalDate === 'string' && DATE_KEY.test(row.scheduledLocalDate)
      ? row.scheduledLocalDate
      : null
  const timeMode: TaskTimeMode = isTaskTimeMode(row.timeMode) ? row.timeMode : 'none'
  let timeMinutes = clampMinutes(
    typeof row.timeMinutesFromMidnight === 'number' ? row.timeMinutesFromMidnight : null,
  )
  if (timeMode === 'none') timeMinutes = null

  let est: number | null = null
  if (typeof row.estimatedMinutes === 'number' && !Number.isNaN(row.estimatedMinutes)) {
    const e = Math.floor(row.estimatedMinutes)
    if (e > 0 && e <= 24 * 60) est = e
  }

  const priorityRank = isPriorityRank(row.priorityRank) ? row.priorityRank : 3
  let recurrence = normalizeRecurrenceRule(row.recurrence)
  let anchor =
    typeof row.recurrenceAnchorLocalDate === 'string' &&
    DATE_KEY.test(row.recurrenceAnchorLocalDate)
      ? row.recurrenceAnchorLocalDate
      : null
  if (recurrence && !anchor) anchor = scheduled
  if (recurrence && !anchor) recurrence = null

  return {
    id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : nowIso(),
    title: typeof row.title === 'string' ? row.title : '',
    groupId: gid,
    colorKey: isColorKey(row.colorKey) ? row.colorKey : 'zinc',
    priorityRank,
    scheduledLocalDate: scheduled,
    estimatedMinutes: est,
    timeMode,
    timeMinutesFromMidnight: timeMinutes,
    recurrence,
    recurrenceAnchorLocalDate: anchor,
  }
}

function repairV5(v: VaultPayloadV5): VaultPayloadV5 {
  const base = repairV4({
    schemaVersion: 4,
    priorityLabels: v.priorityLabels,
    groups: v.groups,
    tasks: v.tasks,
  })
  const groups = base.groups
  const draftsRaw = Array.isArray(v.drafts) ? v.drafts : []
  const drafts: TaskDraft[] = draftsRaw
    .map((d) => (d && typeof d === 'object' ? repairDraft(d as Record<string, unknown>, groups) : null))
    .filter((x): x is TaskDraft => x != null)

  return {
    schemaVersion: 5,
    priorityLabels: base.priorityLabels,
    groups,
    tasks: base.tasks,
    drafts,
  }
}

function migrateV1(v1: VaultPayloadV1): VaultPayloadV2 {
  const groups = [{ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 }]
  const tasks: TaskV2Stored[] = v1.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    done: t.done,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    groupId: DEFAULT_GROUP_ID,
    colorKey: 'zinc',
    subtasks: [],
  }))
  return { schemaVersion: 2, groups, tasks }
}

function migrateV2toV3(v: VaultPayloadV2): VaultPayloadV3 {
  return {
    schemaVersion: 3,
    prioritySystem: 'levels',
    groups: v.groups,
    tasks: v.tasks.map((t) => ({
      ...t,
      priorityLevel: 2,
      eisenhowerQuadrant: null,
    })),
  }
}

function mapV3TaskToV4(t: TaskV3, prioritySystem: PrioritySystem): Task {
  let rank: PriorityRank
  if (prioritySystem === 'eisenhower') {
    const q = t.eisenhowerQuadrant
    if (q === 'q1') rank = 1
    else if (q === 'q2') rank = 2
    else if (q === 'q3') rank = 4
    else if (q === 'q4') rank = 5
    else rank = 3
  } else {
    rank = t.priorityLevel === 1 ? 1 : t.priorityLevel === 2 ? 2 : 3
  }

  const checklist: ChecklistItem[] = (Array.isArray(t.subtasks) ? t.subtasks : []).map((s) => ({
    id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
    title: typeof s.title === 'string' ? s.title : '',
    done: Boolean(s.done),
    createdAt: typeof s.createdAt === 'string' ? s.createdAt : nowIso(),
    updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : nowIso(),
  }))

  return {
    id: typeof t.id === 'string' ? t.id : crypto.randomUUID(),
    title: typeof t.title === 'string' ? t.title : '',
    done: Boolean(t.done),
    createdAt: typeof t.createdAt === 'string' ? t.createdAt : nowIso(),
    updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : nowIso(),
    groupId: typeof t.groupId === 'string' ? t.groupId : DEFAULT_GROUP_ID,
    colorKey: isColorKey(t.colorKey) ? t.colorKey : 'zinc',
    checklist,
    priorityRank: rank,
    scheduledLocalDate: null,
    estimatedMinutes: null,
    timeMode: 'none',
    timeMinutesFromMidnight: null,
    recurrence: null,
    recurrenceAnchorLocalDate: null,
    completedOccurrenceLocalDates: [],
  }
}

function migrateV3toV4(v: VaultPayloadV3): VaultPayloadV4 {
  const prioritySystem = normalizePrioritySystem(v.prioritySystem)
  const tasks = (Array.isArray(v.tasks) ? v.tasks : []).map((t) =>
    mapV3TaskToV4(t, prioritySystem),
  )
  return {
    schemaVersion: 4,
    priorityLabels: defaultPriorityLabels(),
    groups: v.groups,
    tasks,
  }
}

function repairV2(v: VaultPayloadV2): VaultPayloadV2 {
  const groups = Array.isArray(v.groups) && v.groups.length > 0 ? [...v.groups] : LEGACY_DEFAULT_GROUPS()
  const hasDefault = groups.some((g) => g.id === DEFAULT_GROUP_ID)
  if (!hasDefault) {
    groups.unshift({ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 })
  }
  const tasks: TaskV2Stored[] = (Array.isArray(v.tasks) ? v.tasks : []).map((t) => {
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : []
    const groupId =
      typeof t.groupId === 'string' && groups.some((g) => g.id === t.groupId)
        ? t.groupId
        : DEFAULT_GROUP_ID
    const colorKey = isColorKey(t.colorKey) ? t.colorKey : 'zinc'
    return {
      id: typeof t.id === 'string' ? t.id : crypto.randomUUID(),
      title: typeof t.title === 'string' ? t.title : '',
      done: Boolean(t.done),
      createdAt: typeof t.createdAt === 'string' ? t.createdAt : nowIso(),
      updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : nowIso(),
      groupId,
      colorKey,
      subtasks: subtasks.map((s) => ({
        id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
        title: typeof s.title === 'string' ? s.title : '',
        done: Boolean(s.done),
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : nowIso(),
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : nowIso(),
      })),
    }
  })
  return { schemaVersion: 2, groups, tasks }
}

function repairV3(v: VaultPayloadV3): VaultPayloadV3 {
  const prioritySystem = normalizePrioritySystem(v.prioritySystem)
  const groups = Array.isArray(v.groups) && v.groups.length > 0 ? [...v.groups] : LEGACY_DEFAULT_GROUPS()
  const hasDefault = groups.some((g) => g.id === DEFAULT_GROUP_ID)
  if (!hasDefault) {
    groups.unshift({ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 })
  }
  const tasks: TaskV3[] = (Array.isArray(v.tasks) ? v.tasks : []).map((t) => {
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : []
    const groupId =
      typeof t.groupId === 'string' && groups.some((g) => g.id === t.groupId)
        ? t.groupId
        : DEFAULT_GROUP_ID
    const colorKey = isColorKey(t.colorKey) ? t.colorKey : 'zinc'
    const priorityLevel =
      t.priorityLevel === 1 || t.priorityLevel === 2 || t.priorityLevel === 3 ? t.priorityLevel : 2
    const eisenhowerQuadrant = normalizeQuadrant(t.eisenhowerQuadrant)
    return {
      id: typeof t.id === 'string' ? t.id : crypto.randomUUID(),
      title: typeof t.title === 'string' ? t.title : '',
      done: Boolean(t.done),
      createdAt: typeof t.createdAt === 'string' ? t.createdAt : nowIso(),
      updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : nowIso(),
      groupId,
      colorKey,
      priorityLevel,
      eisenhowerQuadrant,
      subtasks: subtasks.map((s) => ({
        id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
        title: typeof s.title === 'string' ? s.title : '',
        done: Boolean(s.done),
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : nowIso(),
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : nowIso(),
      })),
    }
  })
  return { schemaVersion: 3, prioritySystem, groups, tasks }
}

function repairV4(v: VaultPayloadV4): VaultPayloadV4 {
  const priorityLabels = normalizePriorityLabels(v.priorityLabels)
  const groups = Array.isArray(v.groups) && v.groups.length > 0 ? [...v.groups] : LEGACY_DEFAULT_GROUPS()
  const hasDefault = groups.some((g) => g.id === DEFAULT_GROUP_ID)
  if (!hasDefault) {
    groups.unshift({ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 })
  }

  const tasks: Task[] = (Array.isArray(v.tasks) ? v.tasks : []).map((t) => {
    const row = t as Record<string, unknown>
    const checklistRaw = Array.isArray(row.checklist)
      ? row.checklist
      : Array.isArray(row.subtasks)
        ? row.subtasks
        : []

    const checklist: ChecklistItem[] = checklistRaw.map((s) => ({
      id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
      title: typeof s.title === 'string' ? s.title : '',
      done: Boolean(s.done),
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : nowIso(),
      updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : nowIso(),
    }))

    const scheduled =
      typeof t.scheduledLocalDate === 'string' && DATE_KEY.test(t.scheduledLocalDate)
        ? t.scheduledLocalDate
        : null

    const timeMode: TaskTimeMode = isTaskTimeMode(t.timeMode) ? t.timeMode : 'none'
    let timeMinutes = clampMinutes(t.timeMinutesFromMidnight ?? null)
    if (timeMode === 'none') timeMinutes = null

    let est: number | null = null
    if (typeof t.estimatedMinutes === 'number' && !Number.isNaN(t.estimatedMinutes)) {
      const e = Math.floor(t.estimatedMinutes)
      if (e > 0 && e <= 24 * 60) est = e
    }

    const priorityRank = isPriorityRank(t.priorityRank) ? t.priorityRank : 3

    let recurrence = normalizeRecurrenceRule(row.recurrence)
    let recurrenceAnchor: string | null =
      typeof row.recurrenceAnchorLocalDate === 'string' &&
      DATE_KEY.test(row.recurrenceAnchorLocalDate)
        ? row.recurrenceAnchorLocalDate
        : null
    if (recurrence && !recurrenceAnchor) recurrenceAnchor = scheduled
    if (recurrence && !recurrenceAnchor) recurrence = null
    if (!recurrence) recurrenceAnchor = null

    const completedOccurrenceLocalDates = normalizeCompletedOccurrenceDates(
      row.completedOccurrenceLocalDates,
    )

    return {
      id: typeof t.id === 'string' ? t.id : crypto.randomUUID(),
      title: typeof t.title === 'string' ? t.title : '',
      done: Boolean(t.done),
      createdAt: typeof t.createdAt === 'string' ? t.createdAt : nowIso(),
      updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : nowIso(),
      groupId:
        typeof t.groupId === 'string' && groups.some((g) => g.id === t.groupId)
          ? t.groupId
          : DEFAULT_GROUP_ID,
      colorKey: isColorKey(t.colorKey) ? t.colorKey : 'zinc',
      checklist,
      priorityRank,
      scheduledLocalDate: scheduled,
      estimatedMinutes: est,
      timeMode,
      timeMinutesFromMidnight: timeMinutes,
      recurrence,
      recurrenceAnchorLocalDate: recurrenceAnchor,
      completedOccurrenceLocalDates:
        recurrence ? completedOccurrenceLocalDates : [],
      includeInEodRitual: normalizeIncludeInEodRitual(row.includeInEodRitual),
    }
  })

  return { schemaVersion: 4, priorityLabels, groups, tasks }
}

function nowIso(): string {
  return new Date().toISOString()
}
