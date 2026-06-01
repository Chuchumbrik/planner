import { describe, expect, it } from 'vitest'
import {
  applyFilter,
  EMPTY_FILTER,
  filterToParams,
  isFilterActive,
  matchesItem,
  parseFilterFromParams,
  type RoadmapFilter,
} from './roadmapFilter'
import { groupReleasesByDay } from './roadmapTimeline'
import type { RoadmapReleaseNoteBlock, RoadmapReleaseNoteItem } from '@/data/productRoadmap'

function item(v: string, tag: RoadmapReleaseNoteItem['tag'], text: string): RoadmapReleaseNoteItem {
  return { releasedInVersion: { ru: v, en: v }, tag, changes: [{ ru: text, en: text }] }
}

describe('parse/serialize фильтра', () => {
  it('парсит q/tag/from/to и отбрасывает мусорные теги', () => {
    const f = parseFilterFromParams(new URLSearchParams('q=push&tag=feat,xxx,fix&from=0.7.0&to=0.7.15'))
    expect(f.q).toBe('push')
    expect(f.tags).toEqual(['feat', 'fix'])
    expect(f.from).toBe('0.7.0')
    expect(f.to).toBe('0.7.15')
  })
  it('сериализует обратно, опуская пустое', () => {
    expect(filterToParams(EMPTY_FILTER).toString()).toBe('')
    const f: RoadmapFilter = { q: 'a', tags: ['feat'], from: null, to: '0.7.0' }
    expect(filterToParams(f).toString()).toBe('q=a&tag=feat&to=0.7.0')
  })
  it('isFilterActive', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false)
    expect(isFilterActive({ ...EMPTY_FILTER, q: ' ' })).toBe(false)
    expect(isFilterActive({ ...EMPTY_FILTER, tags: ['fix'] })).toBe(true)
  })
})

describe('matchesItem', () => {
  const it1 = item('0.7.10', 'feat', 'добавлен push для повторяющихся')
  it('по тексту changes (регистронезависимо)', () => {
    expect(matchesItem(it1, { ...EMPTY_FILTER, q: 'PUSH' }, 'ru')).toBe(true)
    expect(matchesItem(it1, { ...EMPTY_FILTER, q: 'offline' }, 'ru')).toBe(false)
  })
  it('по тегу', () => {
    expect(matchesItem(it1, { ...EMPTY_FILTER, tags: ['feat'] }, 'ru')).toBe(true)
    expect(matchesItem(it1, { ...EMPTY_FILTER, tags: ['fix'] }, 'ru')).toBe(false)
  })
  it('по диапазону версий (порядок from/to не важен)', () => {
    expect(matchesItem(it1, { ...EMPTY_FILTER, from: '0.7.0', to: '0.7.15' }, 'ru')).toBe(true)
    expect(matchesItem(it1, { ...EMPTY_FILTER, from: '0.7.15', to: '0.7.0' }, 'ru')).toBe(true)
    expect(matchesItem(it1, { ...EMPTY_FILTER, from: '0.7.11' }, 'ru')).toBe(false)
    expect(matchesItem(it1, { ...EMPTY_FILTER, to: '0.7.9' }, 'ru')).toBe(false)
  })
})

describe('applyFilter', () => {
  const blocks: RoadmapReleaseNoteBlock[] = [
    { dateLabel: { ru: '2026-05-31', en: '2026-05-31' }, items: [item('0.7.15', 'feat', 'push'), item('0.7.14', 'fix', 'скролл')] },
    { dateLabel: { ru: '2026-05-30', en: '2026-05-30' }, items: [item('0.7.10', 'docs', 'readme')] },
  ]
  const groups = groupReleasesByDay(blocks)

  it('без фильтра — всё, matched===total', () => {
    const r = applyFilter(groups, EMPTY_FILTER, 'ru')
    expect(r.total).toBe(3)
    expect(r.matched).toBe(3)
    expect(r.groups).toHaveLength(2)
  })
  it('с фильтром — пустые дни выкидываются', () => {
    const r = applyFilter(groups, { ...EMPTY_FILTER, tags: ['fix'] }, 'ru')
    expect(r.matched).toBe(1)
    expect(r.total).toBe(3)
    expect(r.groups).toHaveLength(1)
    expect(r.groups[0].items[0].releasedInVersion.ru).toBe('0.7.14')
  })
})
