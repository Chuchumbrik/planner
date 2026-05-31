import { cn } from '@/lib/cn'

type Props = {
  text: string
  /** Optional custom max-width class. Default is adaptive: comfortable on
   *  desktop (max-w-xs ≈ 320px), narrower on mobile (max-w-[14rem]) so it
   *  doesn't overflow the viewport. */
  width?: string
  /** Pin tooltip to the right edge of the trigger (use near viewport edge). */
  alignRight?: boolean
}

/**
 * Inline info tooltip.
 *
 * Trigger is a real `<button>`:
 *   - hover and `:focus-visible` show the bubble (keyboard accessible)
 *   - reachable in tab order
 *   - stops click propagation (won't toggle parent card's onClick)
 *
 * The bubble is a sibling of the button positioned `absolute` relative to the
 * named-group wrapper. CSS-only — no JS state.
 *
 * Width is adaptive: longer copy gets more room on wide viewports (xs/sm) and
 * caps on mobile so it doesn't get cropped. Comfortable reading width sits
 * around 60–80 characters per line, so `max-w-xs` (320px) at body font is
 * about right. Line-height generous for breathing room.
 */
export function InfoTooltip({ text, width, alignRight = false }: Props) {
  const widthClass = width ?? 'w-[min(20rem,calc(100vw-2rem))] sm:w-[min(22rem,calc(100vw-3rem))]'
  return (
    <span className="group/tip relative inline-flex shrink-0 items-center align-middle">
      <button
        type="button"
        aria-label={text}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
        }}
        className={cn(
          'inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full',
          'text-on-surface-variant/40 transition-colors',
          'hover:text-on-surface-variant/80 focus-visible:text-on-surface-variant',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60',
        )}
      >
        <span
          className="material-symbols-outlined select-none"
          style={{
            fontSize: 12,
            fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 12",
          }}
          aria-hidden="true"
        >
          info
        </span>
      </button>

      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-[calc(100%+8px)] z-[70]',
          alignRight ? 'right-0' : 'left-0',
          widthClass,
          'rounded-lg border border-surface-variant bg-surface-container-high px-3 py-2.5 shadow-xl',
          'text-xs font-normal leading-relaxed text-on-surface',
          'opacity-0 transition-opacity duration-150',
          'group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
        )}
      >
        {text}
      </span>
    </span>
  )
}
