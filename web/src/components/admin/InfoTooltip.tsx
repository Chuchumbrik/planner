import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  text: string
  /** Optional custom max-width class. Default is adaptive: 20rem on mobile,
   *  22rem from sm+, capped to viewport-2rem. */
  width?: string
  /** Hint for initial side preference; runtime measurement still overrides
   *  if the bubble would clip on that side. */
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
 * named-group wrapper. On open we measure its viewport rect; if either edge
 * clips, we apply a horizontal shift (CSS variable `--tip-x`) that pushes
 * the bubble back into view. Width caps to `viewport - 2rem` on mobile, so
 * for narrow screens the bubble centers and pads symmetrically.
 *
 * No popover libraries — measurement + transform keeps it CSS-friendly and
 * cheap. Re-measures on window resize and scroll.
 */
export function InfoTooltip({ text, width, alignRight = false }: Props) {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const [offsetX, setOffsetX] = useState(0)
  const [shown, setShown] = useState(false)
  const id = useId()

  const widthClass = width ?? 'w-[min(20rem,calc(100vw-2rem))] sm:w-[min(22rem,calc(100vw-3rem))]'

  // Measure when shown; re-measure on viewport changes.
  useEffect(() => {
    if (!shown) return
    function measure() {
      const bubble = bubbleRef.current
      if (!bubble) return
      // Reset before reading so we get the natural (unshifted) position.
      bubble.style.setProperty('--tip-x', '0px')
      const rect = bubble.getBoundingClientRect()
      const pad = 8
      let dx = 0
      if (rect.left < pad) dx = pad - rect.left
      else if (rect.right > window.innerWidth - pad) dx = window.innerWidth - pad - rect.right
      setOffsetX(dx)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [shown])

  return (
    <span
      ref={wrapperRef}
      className="group/tip relative inline-flex shrink-0 items-center align-middle"
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
      onFocus={() => setShown(true)}
      onBlur={() => setShown(false)}
    >
      <button
        type="button"
        aria-label={text}
        aria-describedby={id}
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
        ref={bubbleRef}
        id={id}
        role="tooltip"
        style={{ transform: `translateX(${offsetX}px)` }}
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
