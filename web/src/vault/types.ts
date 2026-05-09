/** Группа / проект внутри vault */
export type TaskGroup = {
  id: string
  name: string
  sortOrder: number
}

export type TaskColorKey =
  | 'zinc'
  | 'red'
  | 'orange'
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'pink'

/** Приоритет MVP: шкала 1–5 */
export type PriorityRank = 1 | 2 | 3 | 4 | 5

export const PRIORITY_RANKS: PriorityRank[] = [1, 2, 3, 4, 5]

/** Пользовательские названия уровней приоритета (хранятся в vault) */
export type PriorityLabels = Record<PriorityRank, string>

/** Элемент чек-листа «план работы над задачей» */
export type ChecklistItem = {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

/** Время начала XOR время завершения XOR не задано */
export type TaskTimeMode = 'none' | 'start' | 'end'

/** Правило повтора задачи (якорь — recurrenceAnchorLocalDate) */
export type RecurrenceRule =
  | { kind: 'daily' }
  | { kind: 'everyNDays'; n: number }
  | { kind: 'weekly'; weekdays: number[] }

export type Task = {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
  groupId: string
  colorKey: TaskColorKey
  checklist: ChecklistItem[]
  priorityRank: PriorityRank
  /**
   * null — задача только в бэклоге (для задач без повтора).
   * YYYY-MM-DD — локальный календарный день устройства.
   */
  scheduledLocalDate: string | null
  /** Оценка длительности, минуты; необязательно */
  estimatedMinutes: number | null
  timeMode: TaskTimeMode
  /** Минуты от полуночи 0–1439 при timeMode start | end */
  timeMinutesFromMidnight: number | null
  /** null — без повтора */
  recurrence: RecurrenceRule | null
  /** Первая дата серии повтора (локальный день); нужна если recurrence задан */
  recurrenceAnchorLocalDate: string | null
}

/** Черновик формы создания задачи */
export type TaskDraft = {
  id: string
  updatedAt: string
  title: string
  groupId: string
  colorKey: TaskColorKey
  priorityRank: PriorityRank
  scheduledLocalDate: string | null
  estimatedMinutes: number | null
  timeMode: TaskTimeMode
  timeMinutesFromMidnight: number | null
  recurrence: RecurrenceRule | null
  recurrenceAnchorLocalDate: string | null
}

export type VaultPayloadV4 = {
  schemaVersion: 4
  priorityLabels: PriorityLabels
  groups: TaskGroup[]
  tasks: Task[]
}

export type VaultPayloadV5 = {
  schemaVersion: 5
  priorityLabels: PriorityLabels
  groups: TaskGroup[]
  tasks: Task[]
  drafts: TaskDraft[]
}

/** Поля создания задачи из модального окна */
export type CreateTaskInput = {
  title: string
  groupId: string
  colorKey: TaskColorKey
  priorityRank: PriorityRank
  scheduledLocalDate: string | null
  estimatedMinutes: number | null
  timeMode: TaskTimeMode
  timeMinutesFromMidnight: number | null
  recurrence: RecurrenceRule | null
  recurrenceAnchorLocalDate: string | null
}

/* ---------- Legacy v3 (миграция) ---------- */

export type PriorityLevel = 1 | 2 | 3
export type EisenhowerQuadrant = 'q1' | 'q2' | 'q3' | 'q4'
export type PrioritySystem = 'levels' | 'eisenhower'

export type Subtask = {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export type TaskV3 = {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
  groupId: string
  colorKey: TaskColorKey
  subtasks: Subtask[]
  priorityLevel: PriorityLevel
  eisenhowerQuadrant: EisenhowerQuadrant | null
}

export type VaultPayloadV3 = {
  schemaVersion: 3
  prioritySystem: PrioritySystem
  groups: TaskGroup[]
  tasks: TaskV3[]
}

export type TaskV2Stored = Omit<TaskV3, 'priorityLevel' | 'eisenhowerQuadrant'>

export type VaultPayloadV2 = {
  schemaVersion: 2
  groups: TaskGroup[]
  tasks: TaskV2Stored[]
}

export type VaultPayloadV1 = {
  schemaVersion: 1
  tasks: Array<{
    id: string
    title: string
    done: boolean
    createdAt: string
    updatedAt: string
  }>
}

export type VaultPayload = VaultPayloadV5

export const DEFAULT_GROUP_ID = 'grp_default'

export function defaultPriorityLabels(): PriorityLabels {
  return {
    1: 'Уровень 1',
    2: 'Уровень 2',
    3: 'Уровень 3',
    4: 'Уровень 4',
    5: 'Уровень 5',
  }
}

export function emptyVault(): VaultPayloadV5 {
  return {
    schemaVersion: 5,
    priorityLabels: defaultPriorityLabels(),
    groups: [{ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 }],
    tasks: [],
    drafts: [],
  }
}
