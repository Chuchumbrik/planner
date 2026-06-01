import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import type { RoadmapReleaseTag } from '@/data/productRoadmap'
import { ROADMAP_TAG_META } from './roadmapTagMeta'

/** Цветной чип категории выпуска (feat/fix/…). Цвета/иконки — §8.2 плана. */
export function RoadmapTagChip({ tag, className }: { tag: RoadmapReleaseTag; className?: string }) {
  const meta = ROADMAP_TAG_META[tag]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        meta.chipClass,
        className,
      )}
    >
      <MaterialIcon name={meta.icon} size={12} />
      {tag}
    </span>
  )
}
