import type { RoadmapReleaseTag } from '@/data/productRoadmap'

/** Цвет/иконка tag-чипа выпуска. Источник — `obsidian-motivator/20-Phase-7-План-краткой-сводки.md` §8.2. */
export type RoadmapTagMeta = { icon: string; chipClass: string }

export const ROADMAP_TAG_META: Record<RoadmapReleaseTag, RoadmapTagMeta> = {
  feat: { icon: 'star', chipClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  fix: { icon: 'build_circle', chipClass: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  refactor: { icon: 'construction', chipClass: 'text-violet-300 bg-violet-500/15 border-violet-500/30' },
  docs: { icon: 'description', chipClass: 'text-sky-300 bg-sky-500/15 border-sky-500/30' },
  chore: { icon: 'inventory', chipClass: 'text-zinc-300 bg-zinc-500/15 border-zinc-500/30' },
  perf: { icon: 'speed', chipClass: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30' },
  test: { icon: 'bug_report', chipClass: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30' },
  build: { icon: 'settings', chipClass: 'text-slate-300 bg-slate-500/15 border-slate-500/30' },
  ci: { icon: 'settings', chipClass: 'text-slate-300 bg-slate-500/15 border-slate-500/30' },
  style: { icon: 'brush', chipClass: 'text-rose-300 bg-rose-500/15 border-rose-500/30' },
}
