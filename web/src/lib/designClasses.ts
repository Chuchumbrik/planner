import { cn } from '@/lib/cn'

export const SETTINGS_CARD = 'motivator-card px-4 py-4'

export const SETTINGS_SUBHEAD =
  'mt-4 font-display text-xs font-medium uppercase tracking-wide text-on-surface-variant'

export const SETTINGS_LABEL = 'text-xs text-on-surface-variant'

export const SETTINGS_CHECKBOX_ROW = cn(
  'flex cursor-pointer items-start gap-2 rounded-xl border border-surface-variant',
  'bg-surface-container-low px-4 py-3',
)

export function periodBreakdownToggle(active: boolean): string {
  return cn(
    'rounded-lg border px-2 py-1 font-display text-[11px] font-medium sm:text-xs',
    active
      ? 'border-primary bg-primary/15 text-primary'
      : 'border-surface-variant text-on-surface-variant hover:bg-surface-container',
  )
}

export function weekdayToggle(active: boolean): string {
  return periodBreakdownToggle(active)
}

export const PLANNER_NAV_BTN = cn(
  'shrink-0 rounded-lg border border-surface-variant p-2 text-on-surface',
  'transition-colors hover:bg-surface-container active:scale-95 disabled:opacity-40',
)

export const MOTIVATOR_INPUT = 'motivator-input w-full text-sm disabled:opacity-40'

export const SETTINGS_BTN_SECONDARY = cn(
  'rounded-lg border border-surface-variant bg-surface-container-high px-3 py-2',
  'text-sm text-on-surface transition-colors hover:bg-surface-container-highest disabled:opacity-40',
)

export const CHART_CARD_SHELL = cn(
  'motivator-card flex flex-col items-center gap-1 px-4 py-3',
  'lg:border-surface-variant/80 lg:bg-surface-container-low/50',
)

export const CHART_CARD_TITLE =
  'font-display text-center text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant'

export const CHART_BREAKDOWN_SHELL = cn(
  'motivator-card w-full min-w-0 px-2 py-3 lg:border-surface-variant/80 lg:bg-surface-container-low/50',
)

export const CHART_BREAKDOWN_SHELL_COMPACT = cn(
  CHART_BREAKDOWN_SHELL,
  'flex min-h-0 min-w-0 flex-1 flex-col py-2 lg:py-3',
)

export const VIEW_TABLIST = cn(
  'inline-flex w-full min-w-0 rounded-lg border border-surface-variant',
  'bg-surface-container-low p-0.5 shadow-sm',
)

export function viewTab(active: boolean): string {
  return cn(
    'min-w-0 flex-1 rounded-md px-1.5 py-2 text-center font-display text-xs font-medium leading-tight transition-colors sm:px-3 sm:text-sm',
    active
      ? 'bg-surface-container-highest text-primary shadow-sm ring-1 ring-primary/30'
      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  )
}

export const MODAL_SHELL = cn(
  'flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl',
  'border border-surface-variant bg-surface-container-lowest shadow-2xl sm:max-h-[min(90vh,800px)]',
)

export const MODAL_HEADER =
  'flex shrink-0 items-start justify-between gap-2 border-b border-surface-variant px-4 pb-3 pt-4'

export const MODAL_FOOTER = cn(
  'shrink-0 border-t border-surface-variant bg-surface-container-lowest px-4 pt-3',
  'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
)

export const MODAL_TITLE = 'font-display text-sm font-semibold text-on-surface'

export const MODAL_CLOSE_BTN = 'text-on-surface-variant transition-colors hover:text-on-surface'

export const FIELD_LABEL = SETTINGS_LABEL

export const FIELDSET = 'rounded-xl border border-surface-variant p-3'

export const FIELDSET_LEGEND = 'px-1 font-display text-xs text-on-surface-variant'

export const FILTER_PANEL = cn(
  'rounded-xl border border-surface-variant bg-surface-container-low shadow-inner',
  'max-md:fixed max-md:inset-0 max-md:z-[45] max-md:flex max-md:flex-col max-md:overflow-hidden',
  'max-md:rounded-none max-md:border-0 max-md:bg-surface-container-lowest max-md:p-0 md:p-3',
)

export const DRAFT_LIST_ITEM = cn(
  'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-variant',
  'bg-surface-container-low px-3 py-2 text-sm',
)

export const CHECKBOX_INPUT = cn(
  'h-3.5 w-3.5 shrink-0 rounded border-outline-variant bg-surface-container-low text-primary',
)

export const PLANNER_SECTION_HEAD = cn(
  'mb-3 font-display text-xs font-semibold uppercase tracking-wide text-on-surface-variant',
)

export const EMPTY_STATE_BOX = cn(
  'rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center text-sm text-on-surface-variant',
)

export const MODAL_OVERLAY = 'fixed inset-0 z-[60] flex items-end justify-center glass-overlay p-4 sm:items-center'

export const PLAN_ACCORDION = cn(
  'plan-accordion group mt-4 rounded-xl border border-surface-variant',
  'bg-surface-container-low open:border-primary/30',
)

export const PLAN_ACCORDION_SUMMARY = cn(
  'flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-3',
  'transition-colors hover:bg-surface-container [&::-webkit-details-marker]:hidden',
)
