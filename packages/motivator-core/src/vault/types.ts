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

/** DR-004: второе подтверждение для локального дня (повтор или одиночная задача в контексте дня) */
export type DoubleConfirmPending = {
  /** YYYY-MM-DD */
  localDate: string
  firstStepAtIso: string
  /** После этого момента без второго шага — не засчитываем «сделано» */
  confirmDeadlineIso: string
}

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
  /**
   * Для задач с повтором: локальные дни (YYYY-MM-DD), на которые отмечено выполнение вхождения.
   * Для задач без повтора не используется (хранится пустой массив).
   */
  completedOccurrenceLocalDates: string[]
  /**
   * Участвует во вечернем ритуале End-of-Day ([[DR-002]]). По умолчанию true.
   */
  includeInEodRitual?: boolean
  /** DR-004: два шага перед засчитыванием «выполнено» для этого дня */
  doubleConfirmEnabled?: boolean
  /** Минуты до «второго пинга» (default 10) */
  doubleConfirmIntervalMinutes?: number
  /** Минуты после второго пинга до авто-сброса без «сделано» (default 30) */
  doubleConfirmGraceMinutes?: number
  doubleConfirmPending?: DoubleConfirmPending | null
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

/** Глобальные настройки ритуала End-of-Day ([[DR-002]]) */
export type EodPreferences = {
  enabled: boolean
  /**
   * Если true — для каждого **прошедшего** локального календарного дня, в котором был **хотя бы один** пункт плана
   * (`tasksScheduledForPlannerDay`), дата автоматически попадает в `eodCompletedLocalDates`, если пользователь
   * не прошёл ритуал вручную (компромисс до отдельного решения по «настоящему» авто-EOD).
   */
  autoCloseAtDayEnd?: boolean
}

export type VaultPayloadV6 = {
  schemaVersion: 6
  priorityLabels: PriorityLabels
  groups: TaskGroup[]
  tasks: Task[]
  drafts: TaskDraft[]
  /** Локальные дни (YYYY-MM-DD), когда пользователь завершил ритуал EOD */
  eodCompletedLocalDates: string[]
  eodPreferences: EodPreferences
}

export type VaultPayloadV7 = {
  schemaVersion: 7
  priorityLabels: PriorityLabels
  groups: TaskGroup[]
  tasks: Task[]
  drafts: TaskDraft[]
  eodCompletedLocalDates: string[]
  eodPreferences: EodPreferences
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
  doubleConfirmEnabled?: boolean
  doubleConfirmIntervalMinutes?: number | null
  doubleConfirmGraceMinutes?: number | null
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

export type VaultPayload = VaultPayloadV7

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

export function emptyVault(): VaultPayloadV7 {
  return {
    schemaVersion: 7,
    priorityLabels: defaultPriorityLabels(),
    groups: [{ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 }],
    tasks: [],
    drafts: [],
    eodCompletedLocalDates: [],
    eodPreferences: { enabled: true, autoCloseAtDayEnd: false },
  }
}
