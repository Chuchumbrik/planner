/**
 * Чистая логика Timeline дорожной карты (Phase 7.3): группировка релиз-нот по дням,
 * сортировка по убыванию, anchor-id версии, разбиение на видимые/скрытые группы.
 * Без React/i18n — покрывается юнит-тестами.
 */

import type {
  LocalizedString,
  RoadmapReleaseNoteBlock,
  RoadmapReleaseNoteItem,
} from '@/data/productRoadmap'

export type RoadmapDayGroup = {
  /** `YYYY-MM-DD` (из `dateLabel.ru`). */
  dateISO: string
  dateLabel: LocalizedString
  items: RoadmapReleaseNoteItem[]
}

function semverTuple(v: string): [number, number, number] {
  const m = v.trim().match(/^(\d+)\.(\d+)\.(\d+)/)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0]
}

/** Сравнение версий по убыванию (свежее — раньше). */
export function compareSemverDesc(a: string, b: string): number {
  const [a1, a2, a3] = semverTuple(a)
  const [b1, b2, b3] = semverTuple(b)
  return a1 !== b1 ? b1 - a1 : a2 !== b2 ? b2 - a2 : b3 - a3
}

/** Anchor-id карточки выпуска: `v0.7.15`. */
export function versionAnchorId(version: string): string {
  return `v${version.trim()}`
}

type MergedVersion = { dateISO: string; dateLabel: LocalizedString; item: RoadmapReleaseNoteItem }

/**
 * Группирует релиз-ноты по календарному дню для Timeline.
 *
 * Версия — это один релиз, поэтому несколько items одной версии (в т.ч. под разными датами)
 * сливаются в одну карточку: changes/plainBullets конкатенируются, tag берётся от первого,
 * день карточки — самый свежий из встреченных. Так гарантируется уникальный anchor `v0.7.15`.
 * Дни и версии внутри дня сортируются по убыванию.
 */
export function groupReleasesByDay(blocks: RoadmapReleaseNoteBlock[]): RoadmapDayGroup[] {
  const merged = new Map<string, MergedVersion>()
  for (const block of blocks) {
    const dateISO = block.dateLabel.ru.trim()
    for (const it of block.items) {
      const v = it.releasedInVersion.ru.trim()
      const existing = merged.get(v)
      if (!existing) {
        merged.set(v, {
          dateISO,
          dateLabel: block.dateLabel,
          item: { ...it, changes: [...it.changes], plainBullets: [...(it.plainBullets ?? [])] },
        })
      } else {
        existing.item.changes.push(...it.changes)
        existing.item.plainBullets!.push(...(it.plainBullets ?? []))
        existing.item.tag ??= it.tag
        if (dateISO > existing.dateISO) {
          existing.dateISO = dateISO
          existing.dateLabel = block.dateLabel
        }
      }
    }
  }

  const byDay = new Map<string, RoadmapDayGroup>()
  for (const { dateISO, dateLabel, item } of merged.values()) {
    const normalized = item.plainBullets!.length ? item : { ...item, plainBullets: undefined }
    let group = byDay.get(dateISO)
    if (!group) {
      group = { dateISO, dateLabel, items: [] }
      byDay.set(dateISO, group)
    }
    group.items.push(normalized)
  }

  const groups = [...byDay.values()].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  for (const g of groups) {
    g.items.sort((x, y) => compareSemverDesc(x.releasedInVersion.ru, y.releasedInVersion.ru))
  }
  return groups
}

/**
 * Делит дни на видимые и скрытые: дни добавляются в видимые, пока суммарное число
 * выпусков не достигнет `limit` (день не разрывается). Остальное — скрыто за «Показать ещё».
 */
export function splitDayGroupsByItemLimit(
  groups: RoadmapDayGroup[],
  limit: number,
): { visible: RoadmapDayGroup[]; hidden: RoadmapDayGroup[]; hiddenItems: number } {
  const visible: RoadmapDayGroup[] = []
  const hidden: RoadmapDayGroup[] = []
  let shown = 0
  for (const g of groups) {
    if (shown >= limit) {
      hidden.push(g)
    } else {
      visible.push(g)
      shown += g.items.length
    }
  }
  const hiddenItems = hidden.reduce((sum, g) => sum + g.items.length, 0)
  return { visible, hidden, hiddenItems }
}
