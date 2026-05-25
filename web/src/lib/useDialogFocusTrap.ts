import { type RefObject, useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0),
  )
}

/**
 * Trap Tab focus inside an open dialog and restore focus to the trigger on close.
 */
export function useDialogFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
  restoreFocus = true,
) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusInitial = () => {
      const preferred = initialFocusRef?.current
      if (preferred) {
        preferred.focus()
        return
      }
      const focusables = getFocusableElements(container)
      const first = focusables[0]
      if (first) {
        first.focus()
      } else {
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1')
        }
        container.focus()
      }
    }

    const raf = requestAnimationFrame(focusInitial)

    const trapped = container

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusables = getFocusableElements(trapped)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeEl = document.activeElement

      if (e.shiftKey) {
        if (activeEl === first || activeEl == null || !trapped.contains(activeEl)) {
          e.preventDefault()
          last.focus()
        }
      } else if (activeEl === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
      if (restoreFocus && previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus()
      }
    }
  }, [active, containerRef, initialFocusRef, restoreFocus])
}
