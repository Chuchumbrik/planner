import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof globalThis === 'undefined' || !('matchMedia' in globalThis)) return false
    return globalThis.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !('matchMedia' in globalThis)) return
    const mq = globalThis.matchMedia(query)
    function onChange() {
      setMatches(mq.matches)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Tailwind `md` — matches MotivatorShell sidebar breakpoint. */
export function useIsDesktopShell(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/**
 * Tailwind `xl` (1280px) — порог постоянной левой панели планировщика (Phase 13, BR-D-010).
 * Ниже — левая панель уходит в drawer.
 */
export function useIsLeftPanelDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)')
}
