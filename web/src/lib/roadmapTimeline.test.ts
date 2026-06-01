import { describe, expect, it } from 'vitest'
import {
  compareSemverDesc,
  groupReleasesByDay,
  splitDayGroupsByItemLimit,
  versionAnchorId,
} from './roadmapTimeline'
import { RELEASE_NOTES_BLOCKS, type RoadmapReleaseNoteBlock } from '@/data/productRoadmap'

function block(date: string, ...versions: string[]): RoadmapReleaseNoteBlock {
  return {
    dateLabel: { ru: date, en: date },
    items: versions.map((v) => ({
      releasedInVersion: { ru: v, en: v },
      changes: [{ ru: `change ${v}`, en: `change ${v}` }],
    })),
  }
}

describe('compareSemverDesc', () => {
  it('сортирует версии по убыванию', () => {
    const sorted = ['0.7.2', '0.7.15', '0.6.9'].sort(compareSemverDesc)
    expect(sorted).toEqual(['0.7.15', '0.7.2', '0.6.9'])
  })
})

describe('versionAnchorId', () => {
  it('строит anchor-id', () => {
    expect(versionAnchorId('0.7.15')).toBe('v0.7.15')
    expect(versionAnchorId('  0.7.0 ')).toBe('v0.7.0')
  })
})

describe('groupReleasesByDay', () => {
  it('склеивает блоки одного дня и сортирует дни и версии по убыванию', () => {
    const groups = groupReleasesByDay([
      block('2026-05-30', '0.7.0'),
      block('2026-05-31', '0.7.14'),
      block('2026-05-31', '0.7.15'),
    ])
    expect(groups.map((g) => g.dateISO)).toEqual(['2026-05-31', '2026-05-30'])
    expect(groups[0].items.map((i) => i.releasedInVersion.ru)).toEqual(['0.7.15', '0.7.14'])
    expect(groups[1].items).toHaveLength(1)
  })
})

describe('groupReleasesByDay — слияние версий-дублей', () => {
  it('несколько items одной версии в дне → одна карточка с объединёнными changes', () => {
    const groups = groupReleasesByDay([
      {
        dateLabel: { ru: '2026-06-01', en: '2026-06-01' },
        items: [
          { releasedInVersion: { ru: '0.6.1', en: '0.6.1' }, changes: [{ ru: 'a', en: 'a' }] },
          {
            releasedInVersion: { ru: '0.6.1', en: '0.6.1' },
            changes: [{ ru: 'b', en: 'b' }],
            plainBullets: [{ ru: 'p', en: 'p' }],
          },
        ],
      },
    ])
    expect(groups[0].items).toHaveLength(1)
    expect(groups[0].items[0].changes).toHaveLength(2)
    expect(groups[0].items[0].plainBullets).toHaveLength(1)
  })

  it('реальные данные: anchor-id глобально уникальны', () => {
    const groups = groupReleasesByDay(RELEASE_NOTES_BLOCKS)
    const ids = groups.flatMap((g) => g.items.map((i) => versionAnchorId(i.releasedInVersion.ru)))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('splitDayGroupsByItemLimit', () => {
  const groups = groupReleasesByDay([
    block('2026-05-31', '0.7.15', '0.7.14'),
    block('2026-05-30', '0.7.13', '0.7.12', '0.7.11'),
    block('2026-05-29', '0.7.10'),
  ])

  it('не разрывает день; скрывает остаток после лимита', () => {
    const { visible, hidden, hiddenItems } = splitDayGroupsByItemLimit(groups, 5)
    // день1 (2) → shown 2; день2 (3) → shown 5; день3 уже сверх лимита → скрыт
    expect(visible.map((g) => g.dateISO)).toEqual(['2026-05-31', '2026-05-30'])
    expect(hidden.map((g) => g.dateISO)).toEqual(['2026-05-29'])
    expect(hiddenItems).toBe(1)
  })

  it('лимит больше суммы — ничего не скрыто', () => {
    const { hidden, hiddenItems } = splitDayGroupsByItemLimit(groups, 100)
    expect(hidden).toHaveLength(0)
    expect(hiddenItems).toBe(0)
  })
})
