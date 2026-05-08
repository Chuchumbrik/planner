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
}

export type VaultPayloadV2 = {
  schemaVersion: 2
  groups: TaskGroup[]
  tasks: Task[]
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

export type VaultPayload = VaultPayloadV2

export const DEFAULT_GROUP_ID = 'grp_default'

export function emptyVault(): VaultPayloadV2 {
  return {
    schemaVersion: 2,
    groups: [{ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 }],
    tasks: [],
  }
}
