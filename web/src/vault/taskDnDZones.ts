import type { EisenhowerQuadrant, PriorityLevel, PrioritySystem, Task } from '@/vault/types'

export const ZONE_EISEN_INBOX = 'eisen-inbox'

export function zoneIdForLevel(level: PriorityLevel): string {
  return `lvl-${level}`
}

export function zoneIdForQuadrant(q: EisenhowerQuadrant): string {
  return `eisen-${q}`
}

/** Разрешить id зоны сброса: явная зона или задача, на которую бросили */
export function resolveZoneString(
  overId: string,
  tasks: Task[],
  system: PrioritySystem,
): string | null {
  if (system === 'levels') {
    if (/^lvl-[123]$/.test(overId)) return overId
  } else {
    if (overId === ZONE_EISEN_INBOX || /^eisen-q[1-4]$/.test(overId)) return overId
  }
  const task = tasks.find((t) => t.id === overId)
  if (!task) return null
  if (system === 'levels') return zoneIdForLevel(task.priorityLevel)
  return task.eisenhowerQuadrant === null
    ? ZONE_EISEN_INBOX
    : zoneIdForQuadrant(task.eisenhowerQuadrant)
}

export function parseZoneId(
  zoneId: string,
  system: PrioritySystem,
): { level: PriorityLevel } | { quadrant: EisenhowerQuadrant | null } | null {
  if (system === 'levels') {
    const m = /^lvl-([123])$/.exec(zoneId)
    return m ? { level: Number(m[1]) as PriorityLevel } : null
  }
  if (zoneId === ZONE_EISEN_INBOX) return { quadrant: null }
  const mq = /^eisen-(q[1-4])$/.exec(zoneId)
  return mq ? { quadrant: mq[1] as EisenhowerQuadrant } : null
}
