import { cn } from '@/lib/cn'

type Props = {
  text: string
  /** Tailwind max-w-* class for tooltip width, default max-w-[13rem] */
  width?: string
  /** Position the tooltip to the right instead of left (near right edge) */
  alignRight?: boolean
}

/**
 * Inline info icon that shows a hover/focus tooltip.
 * CSS-only, no JS state. Uses named Tailwind group to avoid cascade.
 */
export function InfoTooltip({ text, width = 'max-w-[13rem]', alignRight = false }: Props) {
  return (
    <span className="group/tip relative inline-flex shrink-0 cursor-help items-center align-middle">
      {/* icon */}
      <span
        className="material-symbols-outlined select-none text-on-surface-variant/30 transition-colors group-hover/tip:text-on-surface-variant/70"
        style={{ fontSize: 12, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 12" }}
        aria-hidden="true"
      >
        info
      </span>

      {/* tooltip bubble */}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-[calc(100%+6px)] z-[70]',
          alignRight ? 'right-0' : 'left-0',
          width,
          'rounded-lg border border-surface-variant bg-surface-container-high px-3 py-2 shadow-xl',
          'text-[11px] font-normal leading-relaxed text-on-surface',
          'opacity-0 transition-opacity duration-150',
          'group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
        )}
      >
        {text}
      </span>
    </span>
  )
}
