import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { DRAFT_COUNT_BADGE_ON_FAB, FAB, FAB_SHELL } from '@/lib/designClasses'

type PlannerCreateFabProps = {
  disabled?: boolean
  ariaLabel: string
  onClick: () => void
  draftCount?: number
  onDraftsClick?: () => void
  draftsBadgeLabel?: string
}

/** FAB «+» — mobile над нижней навигацией; desktop компактный у правого края экрана. */
export function PlannerCreateFab({
  disabled,
  ariaLabel,
  onClick,
  draftCount = 0,
  onDraftsClick,
  draftsBadgeLabel,
}: PlannerCreateFabProps) {
  return (
    <div className={FAB_SHELL}>
      <div className="relative">
        <button
          type="button"
          className={FAB}
          disabled={disabled}
          aria-label={ariaLabel}
          onClick={onClick}
        >
          <MaterialIcon name="add" size={28} className="motivator-fab-icon text-on-primary" />
        </button>
        {draftCount > 0 && onDraftsClick ? (
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-label={draftsBadgeLabel}
            title={draftsBadgeLabel}
            className={DRAFT_COUNT_BADGE_ON_FAB}
            onClick={(e) => {
              e.stopPropagation()
              onDraftsClick()
            }}
          >
            {draftCount > 99 ? '99+' : draftCount}
          </button>
        ) : null}
      </div>
    </div>
  )
}
