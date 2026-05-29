import { useCallback, useEffect, useRef } from 'react'

/**
 * Stable ref to a value that may change identity often (e.g. i18next's `t`
 * function), so a `useCallback` that needs to read it doesn't have to list it
 * as a dependency — preventing spurious re-creations and re-fetches on locale
 * change or unrelated re-renders.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

type AbortableLoader = (signal: AbortSignal) => Promise<void>

/**
 * Runs `loader` when `deps` change, providing an `AbortSignal` that fires
 * on unmount or before the next run. Standard cleanup for admin Supabase
 * fetches — extracted from 5 duplicate hook bodies.
 *
 * `enabled=false` skips the run without aborting (used for lazy loads).
 *
 * Returns a `runManual()` callback that triggers a fresh, abortable run
 * (used by Refresh buttons). The manual run replaces any in-flight run.
 */
export function useAbortableInvoke(
  loader: AbortableLoader,
  deps: ReadonlyArray<unknown>,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true
  const ctrlRef = useRef<AbortController | null>(null)

  // start/cancel auto-run when deps change
  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    ctrlRef.current?.abort()
    ctrlRef.current = ctrl
    void loader(ctrl.signal)
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  // unmount safety net
  useEffect(
    () => () => {
      ctrlRef.current?.abort()
    },
    [],
  )

  const runManual = useCallback(() => {
    const ctrl = new AbortController()
    ctrlRef.current?.abort()
    ctrlRef.current = ctrl
    void loader(ctrl.signal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { runManual }
}
