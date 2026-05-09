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

/** Уровни 1–3 */
export type PriorityLevel = 1 | 2 | 3

/** Квадрант Эйзенхауэра; на задаче null = Inbox */
export type EisenhowerQuadrant = 'q1' | 'q2' | 'q3' | 'q4'

export const EISENHOWER_QUADRANTS: EisenhowerQuadrant[] = ['q1', 'q2', 'q3', 'q4']

/** Режим отображения и классификации задач */
export type PrioritySystem = 'levels' | 'eisenhower'

export type Subtask = {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
  groupId: string
  colorKey: TaskColorKey
  subtasks: Subtask[]
  priorityLevel: PriorityLevel
  /** null = Inbox при режиме Эйзенхауэра */
  eisenhowerQuadrant: EisenhowerQuadrant | null
}

export type VaultPayloadV3 = {
  schemaVersion: 3
  prioritySystem: PrioritySystem
  groups: TaskGroup[]
  tasks: Task[]
}

/** Задача в сохранённом vault v2 (без полей приоритета) */
export type TaskV2Stored = Omit<Task, 'priorityLevel' | 'eisenhowerQuadrant'>

export type VaultPayloadV2 = {
  schemaVersion: 2
  groups: TaskGroup[]
  tasks: TaskV2Stored[]
}

/** Совместимость со старыми данными */
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

export type VaultPayload = VaultPayloadV3

export const DEFAULT_GROUP_ID = 'grp_default'

export function emptyVault(): VaultPayloadV3 {
  return {
    schemaVersion: 3,
    prioritySystem: 'levels',
    groups: [{ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 }],
    tasks: [],
  }
}
