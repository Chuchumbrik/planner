import type { ReactNode } from 'react'
import { SETTINGS_CARD } from '@/lib/designClasses'

type Props = {
  title: string
  hint?: string
  hint2?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Reusable admin card with title / subtitle / optional action button.
 * Consolidates the repeated header pattern across admin chart components.
 */
export function AdminCardSection({ title, hint, hint2, action, children, className }: Props) {
  return (
    <section className={`${SETTINGS_CARD}${className ? ` ${className}` : ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold text-on-surface">{title}</h3>
          {hint ? (
            <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>
          ) : null}
          {hint2 ? (
            <p className="mt-1 text-xs text-on-surface-variant/70">{hint2}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
