import { cn } from '@/lib/cn'

type Props = {
  text: string
  /** Tailwind max-w-* class for the bubble. */
  width?: string
  /** Pin tooltip to the right edge of the trigger (use near viewport edge). */
  alignRight?: boolean
}

/**
 * Inline info tooltip.
 *
 * Trigger is a real `<button>` so it:
 *   - shows on `:hover` and `:focus-visible` (keyboard accessible)
 *   - is reachable in tab order
 *   - stops click propagation (won't trigger parent card's onClick)
 *
 * CSS-only; no JS state. The bubble is rendered as the button's sibling and
 * positioned absolutely relative to the named-group wrapper.
 */
export function InfoTooltip({ text, width = 'max-w-[13rem]', alignRight = false }: Props) {
  return (
    <span className="group/tip relative inline-flex shrink-0 items-center align-middle">
      <button
        type="button"
        aria-label={text}
        // Tooltip text duplicates the content for screen readers — both work
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Prevent space/enter from activating parent interactive elements
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
