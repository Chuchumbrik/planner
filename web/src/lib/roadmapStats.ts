/**
 * Агрегации для футер-статистики дорожной карты (Phase 7.6). Чистая логика, без React.
 */

import type {
  RoadmapIdeaEntry,
  RoadmapIdeaStatus,
  RoadmapReleaseNoteBlock,
} from '@/data/productRoadmap'
import { daysAgo } from './relativeTime'
import { groupReleasesByDay } from './roadmapTimeline'

export type ReleaseCounts = { total: number; last7: number; last30: number }

/** Кол-во выпусков (по версиям-карточкам) всего / за 7 / за 30 дней. */
export function releaseCounts(blocks: RoadmapReleaseNoteBlock[], now: Date): ReleaseCounts {
  let total = 0
  let last7 = 0
  let last30 = 0
  for (const g of groupReleasesByDay(blocks)) {
    const d = daysAgo(g.dateISO, now)
    for (let i = 0; i < g.items.length; i++) {
      total++
      if (d >= 0 && d <= 7) last7++
      if (d >= 0 && d <= 30) last30++
    }
  }
  return { total, last7, last30 }
}

/** Порядок статусов идей для отображения. */
export const IDEA_STATUS_ORDER: RoadmapIdeaStatus[] = [
  'proposed',
  'accepted',
  'in-discussion',
  'shipped',
  'rejected',
]

export type IdeaStatusCounts = Record<RoadmapIdeaStatus, number>

/** Счётчики идей по статусам (идеи без статуса не учитываются). */
export function ideaStatusCounts(ideas: RoadmapIdeaEntry[]): IdeaStatusCounts {
  const counts: IdeaStatusCounts = {
    proposed: 0,
    accepted: 0,
    'in-discussion': 0,
    shipped: 0,
    rejected: 0,
  }
  for (const idea of ideas) {
    if (idea.status) counts[idea.status]++
  }
  return counts
}

export type WeekBucket = { weeksAgo: number; count: number }

/**
 * Скорость релизов по неделям за последние `weeks` недель (для sparkline).
 * Результат — от самой старой недели к текущей (слева направо).
 */
export function releasesPerWeek(
  blocks: RoadmapReleaseNoteBlock[],
  now: Date,
  weeks: number,
): WeekBucket[] {
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    weeksAgo: weeks - 1 - i,
    count: 0,
  }))
  for (const g of groupReleasesByDay(blocks)) {
    const d = daysAgo(g.dateISO, now)
    if (d < 0) continue
    const w = Math.floor(d / 7)
    if (w < weeks) buckets[weeks - 1 - w].count += g.items.length
  }
  return buckets
}
