/**
 * Чистая логика фильтра Timeline дорожной карты (Phase 7.4).
 * Состояние фильтра — в URL query (`?q=&tag=&from=&to=`). Без React — покрывается юнит-тестами.
 */

import type {
  RoadmapReleaseNoteItem,
  RoadmapReleaseTag,
} from '@/data/productRoadmap'
import { compareSemverDesc, type RoadmapDayGroup } from './roadmapTimeline'

/** Все теги в порядке отображения чипов фильтра. */
export const ROADMAP_FILTER_TAGS: RoadmapReleaseTag[] = [
  'feat',
  'fix',
  'refactor',
  'perf',
  'docs',
  'style',
  'test',
  'build',
  'ci',
  'chore',
]

export type RoadmapFilter = {
  q: string
  tags: RoadmapReleaseTag[]
  from: string | null
  to: string | null
}

export const EMPTY_FILTER: RoadmapFilter = { q: '', tags: [], from: null, to: null }

const TAG_SET = new Set<string>(ROADMAP_FILTER_TAGS)

/** Разбор фильтра из URLSearchParams. */
export function parseFilterFromParams(params: URLSearchParams): RoadmapFilter {
  const tags = (params.get('tag') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((t): t is RoadmapReleaseTag => TAG_SET.has(t))
  return {
    q: params.get('q') ?? '',
    tags,
    from: params.get('from') || null,
    to: params.get('to') || null,
  }
}

/** Сериализация фильтра в URLSearchParams (пустые поля опускаются). */
export function filterToParams(filter: RoadmapFilter): URLSearchParams {
  const p = new URLSearchParams()
  if (filter.q.trim()) p.set('q', filter.q.trim())
  if (filter.tags.length) p.set('tag', filter.tags.join(','))
  if (filter.from) p.set('from', filter.from)
  if (filter.to) p.set('to', filter.to)
  return p
}

export function isFilterActive(filter: RoadmapFilter): boolean {
  return Boolean(filter.q.trim() || filter.tags.length || filter.from || filter.to)
}

/** Версия в диапазоне [from, to] (границы опциональны; порядок from/to нормализуется). */
function versionInRange(version: string, from: string | null, to: string | null): boolean {
  let lo = from
  let hi = to
  if (lo && hi && compareSemverDesc(lo, hi) < 0) {
    // compareSemverDesc(lo,hi) < 0 ⇒ lo > hi — меняем местами
    ;[lo, hi] = [hi, lo]
  }
  if (lo && compareSemverDesc(version, lo) > 0) return false // version < lo
  if (hi && compareSemverDesc(version, hi) < 0) return false // version > hi
  return true
}

/** Проходит ли выпуск под фильтр (поиск по changes+plainBullets, тег, диапазон версий). */
export function matchesItem(
  item: RoadmapReleaseNoteItem,
  filter: RoadmapFilter,
  lang: 'ru' | 'en',
): boolean {
  if (filter.tags.length && (!item.tag || !filter.tags.includes(item.tag))) return false

  const version = lang === 'en' ? item.releasedInVersion.en : item.releasedInVersion.ru
  if (!versionInRange(version, filter.from, filter.to)) return false

  const q = filter.q.trim().toLowerCase()
  if (q) {
    const hay = [...item.changes, ...(item.plainBullets ?? [])]
      .map((s) => (lang === 'en' ? s.en : s.ru))
      .join(' ')
      .toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

/**
 * Применяет фильтр к дням: оставляет подходящие выпуски, выкидывает пустые дни.
 * Возвращает отфильтрованные группы и счётчики matched/total (по выпускам).
 */
export function applyFilter(
  groups: RoadmapDayGroup[],
  filter: RoadmapFilter,
  lang: 'ru' | 'en',
): { groups: RoadmapDayGroup[]; matched: number; total: number } {
  const active = isFilterActive(filter)
  let total = 0
  let matched = 0
  const out: RoadmapDayGroup[] = []
  for (const g of groups) {
    total += g.items.length
    const items = active ? g.items.filter((i) => matchesItem(i, filter, lang)) : g.items
    matched += items.length
    if (items.length) out.push({ ...g, items })
  }
  return { groups: out, matched, total }
}
