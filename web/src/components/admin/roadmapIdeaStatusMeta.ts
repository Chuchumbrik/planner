import type { RoadmapIdeaEntry, RoadmapIdeaStatus } from '@/data/productRoadmap'

/** Цвет status-чипа идеи. Источник — `obsidian-motivator/20-Phase-7-План-краткой-сводки.md` §8.3. */
export type RoadmapIdeaStatusMeta = { chipClass: string }

export const ROADMAP_IDEA_STATUS_META: Record<RoadmapIdeaStatus, RoadmapIdeaStatusMeta> = {
  proposed: { chipClass: 'text-on-surface-variant bg-surface-variant/40 border-surface-variant/70' },
  accepted: { chipClass: 'text-blue-300 bg-blue-500/15 border-blue-500/30' },
  'in-discussion': { chipClass: 'text-orange-300 bg-orange-500/15 border-orange-500/30' },
  shipped: { chipClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  rejected: { chipClass: 'text-on-surface-variant/50 bg-surface-variant/20 border-surface-variant/40 line-through' },
}

/**
 * Куда ведёт кликабельная идея: shipped+linkedVersion → anchor выпуска в Timeline;
 * linkedDiscussion → тред в `/admin/discussions`. Иначе — не кликабельна.
 */
export function ideaLinkHref(idea: RoadmapIdeaEntry): string | null {
  if (idea.status === 'shipped' && idea.linkedVersion) return `#v${idea.linkedVersion}`
  if (idea.linkedDiscussion) return `/admin/discussions#${idea.linkedDiscussion}`
  return null
}
