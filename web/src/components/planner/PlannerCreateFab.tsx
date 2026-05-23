import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { FAB } from '@/lib/designClasses'

type PlannerCreateFabProps = {
  disabled?: boolean
  ariaLabel: string
  onClick: () => void
}

/** Mobile FAB «+» над нижней навигацией (Stitch daily planner). */
export function PlannerCreateFab({ disabled, ariaLabel, onClick }: PlannerCreateFabProps) {
  return (
    <button
      type="button"
      className={FAB}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <MaterialIcon name="add" size={28} className="text-on-primary" />
    </button>
  )
}
