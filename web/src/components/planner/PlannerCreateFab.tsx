import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  DRAFT_COUNT_BADGE_STACKED,
  FAB,
  FAB_SHELL_FIXED,
  FAB_SHELL_INLINE,
} from '@/lib/designClasses'

type PlannerCreateFabProps = {
  variant?: 'fixed' | 'inline'
  disabled?: boolean
  ariaLabel: string
  onClick: () => void
  draftCount?: number
  onDraftsClick?: () => void
  draftsBadgeLabel?: string
}

/** FAB «+» — mobile: fixed над bottom nav; desktop: в строке фильтров. */
export function PlannerCreateFab({
  variant = 'fixed',
  disabled,
  ariaLabel,
  onClick,
  draftCount = 0,
  onDraftsClick,
  draftsBadgeLabel,
}: PlannerCreateFabProps) {
  const shellClass = variant === 'inline' ? FAB_SHELL_INLINE : FAB_SHELL_FIXED

  return (
    <div className={shellClass}>
      <div className="flex flex-col items-center gap-1.5">
        {draftCount > 0 && onDraftsClick ? (
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-label={draftsBadgeLabel}
            title={draftsBadgeLabel}
            className={DRAFT_COUNT_BADGE_STACKED}
            onClick={(e) => {
              e.stopPropagation()
              onDraftsClick()
            }}
          >
            {draftCount > 99 ? '99+' : draftCount}
          </button>
        ) : null}
        <button
          type="button"
          className={cn(FAB, variant === 'inline' && 'motivator-fab--toolbar')}
          disabled={disabled}
          aria-label={ariaLabel}
          onClick={onClick}
        >
          <MaterialIcon name="add" size={28} className="motivator-fab-icon text-on-primary" />
        </button>
      </div>
    </div>
  )
}
