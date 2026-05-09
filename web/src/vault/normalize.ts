import {
  DEFAULT_GROUP_ID,
  emptyVault,
  type EisenhowerQuadrant,
  type PriorityLevel,
  type PrioritySystem,
  type Task,
  type TaskColorKey,
  type TaskV2Stored,
  type VaultPayloadV1,
  type VaultPayloadV2,
  type VaultPayloadV3,
} from '@/vault/types'

function isColorKey(x: unknown): x is TaskColorKey {
  return (
    typeof x === 'string' &&
    ['zinc', 'red', 'orange', 'amber', 'emerald', 'sky', 'violet', 'pink'].includes(x)
  )
}

function isPriorityLevel(x: unknown): x is PriorityLevel {
  return x === 1 || x === 2 || x === 3
}

function normalizeQuadrant(q: unknown): EisenhowerQuadrant | null {
  if (q === null || q === undefined) return null
  if (q === 'q1' || q === 'q2' || q === 'q3' || q === 'q4') return q
  return null
}

function normalizePrioritySystem(x: unknown): PrioritySystem {
  return x === 'eisenhower' ? 'eisenhower' : 'levels'
}

/** Приводит произвольный JSON к актуальной схеме v3 */
export function normalizeVault(raw: unknown): VaultPayloadV3 {
  if (!raw || typeof raw !== 'object') return emptyVault()
  const o = raw as Record<string, unknown>

  if (o.schemaVersion === 3 && Array.isArray(o.tasks) && Array.isArray(o.groups)) {
    return repairV3(o as VaultPayloadV3)
  }

  if (o.schemaVersion === 2 && Array.isArray(o.tasks) && Array.isArray(o.groups)) {
    return migrateV2toV3(repairV2(o as VaultPayloadV2))
  }

  if (o.schemaVersion === 1 && Array.isArray(o.tasks)) {
    return migrateV2toV3(repairV2(migrateV1(o as VaultPayloadV1)))
  }

  return emptyVault()
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

function repairV2(v: VaultPayloadV2): VaultPayloadV2 {
  const groups = Array.isArray(v.groups) && v.groups.length > 0 ? [...v.groups] : emptyVault().groups
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
  const groups = Array.isArray(v.groups) && v.groups.length > 0 ? [...v.groups] : emptyVault().groups
  const hasDefault = groups.some((g) => g.id === DEFAULT_GROUP_ID)
  if (!hasDefault) {
    groups.unshift({ id: DEFAULT_GROUP_ID, name: 'Общее', sortOrder: 0 })
  }
  const tasks: Task[] = (Array.isArray(v.tasks) ? v.tasks : []).map((t) => {
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : []
    const groupId =
      typeof t.groupId === 'string' && groups.some((g) => g.id === t.groupId)
        ? t.groupId
        : DEFAULT_GROUP_ID
    const colorKey = isColorKey(t.colorKey) ? t.colorKey : 'zinc'
    const priorityLevel = isPriorityLevel(t.priorityLevel) ? t.priorityLevel : 2
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

function nowIso(): string {
  return new Date().toISOString()
}
