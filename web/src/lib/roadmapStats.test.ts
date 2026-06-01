import { describe, expect, it } from 'vitest'
import { ideaStatusCounts, releaseCounts, releasesPerWeek } from './roadmapStats'
import type { RoadmapIdeaEntry, RoadmapReleaseNoteBlock } from '@/data/productRoadmap'

const NOW = new Date('2026-06-01T12:00:00Z')

function block(date: string, ...versions: string[]): RoadmapReleaseNoteBlock {
  return {
    dateLabel: { ru: date, en: date },
    items: versions.map((v) => ({ releasedInVersion: { ru: v, en: v }, changes: [{ ru: 'x', en: 'x' }] })),
  }
}

const BLOCKS: RoadmapReleaseNoteBlock[] = [
  block('2026-06-01', '0.7.18'), // 0 дней
  block('2026-05-28', '0.7.16'), // 4 дня
  block('2026-05-10', '0.7.10'), // 22 дня
  block('2026-04-01', '0.7.0'), // 61 день
]

describe('releaseCounts', () => {
  it('всего / за 7 / за 30 дней', () => {
    expect(releaseCounts(BLOCKS, NOW)).toEqual({ total: 4, last7: 2, last30: 3 })
  })
})

describe('ideaStatusCounts', () => {
  it('считает по статусам, без статуса — мимо', () => {
    const ideas: RoadmapIdeaEntry[] = [
      { title: { ru: 'a', en: 'a' }, summary: { ru: '', en: '' }, status: 'proposed' },
      { title: { ru: 'b', en: 'b' }, summary: { ru: '', en: '' }, status: 'proposed' },
      { title: { ru: 'c', en: 'c' }, summary: { ru: '', en: '' }, status: 'shipped' },
      { title: { ru: 'd', en: 'd' }, summary: { ru: '', en: '' } },
    ]
    const c = ideaStatusCounts(ideas)
    expect(c.proposed).toBe(2)
    expect(c.shipped).toBe(1)
    expect(c.accepted).toBe(0)
  })
})

describe('releasesPerWeek', () => {
  it('бакеты от старой недели к текущей; сумма = релизы в окне', () => {
    const weeks = releasesPerWeek(BLOCKS, NOW, 12)
    expect(weeks).toHaveLength(12)
    expect(weeks[weeks.length - 1].weeksAgo).toBe(0)
    // 0.7.18 (0 дн) и 0.7.16 (4 дн) — обе в текущей неделе
    expect(weeks[weeks.length - 1].count).toBe(2)
    // 0.7.10 (22 дня → неделя 3)
    expect(weeks.find((w) => w.weeksAgo === 3)?.count).toBe(1)
    // 0.7.0 (61 день → неделя 8)
    expect(weeks.find((w) => w.weeksAgo === 8)?.count).toBe(1)
  })
})
