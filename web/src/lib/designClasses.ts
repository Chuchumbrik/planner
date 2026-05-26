import { cn } from '@/lib/cn'

/** Page shell — max 1200px, mobile side margins from DESIGN.md */
export const PAGE_CONTAINER = cn(
  'mx-auto w-full max-w-desktop px-margin-mobile md:px-6',
)

/** Vertical rhythm between major sections (40px) */
export const SECTION_GAP = 'space-y-lg'

export const SETTINGS_CARD = 'motivator-card p-sm md:p-md'

export const SETTINGS_SUBHEAD = cn(
  'mt-4 text-label-sm uppercase text-on-surface-variant',
)

export const SETTINGS_LABEL = 'text-label-sm text-on-surface-variant'

/** Slim horizontal scrollbar rail — charts and wide tables (Design 2.0). */
export const SCROLLBAR_SLIDER_H = 'scrollbar-slider-h'

export const STAT_CARD = cn(
  'motivator-card shrink-0 snap-start p-sm min-w-[8.75rem]',
)

export const STAT_CARD_VALUE = 'text-headline-md font-display text-primary tabular-nums'

/** Large KPI number in reports / stat row */
export const STAT_KPI_VALUE = 'font-display text-2xl font-semibold text-primary tabular-nums'

export const STAT_CARD_LABEL = 'text-label-sm text-on-surface-variant'

export const FILTER_CHIP = cn('motivator-chip motivator-chip-active py-1 pl-2.5 pr-1')

export const FILTER_CHIP_DISMISS = 'motivator-chip-dismiss'

export const FILTER_CHIP_RESET = 'motivator-link-subtle'

export const CHIP = 'motivator-chip'

export function chipActive(active: boolean): string {
  return cn('motivator-chip', active && 'motivator-chip-active')
}

/** Fixed viewport anchor for create FAB (mobile). */
export const FAB_SHELL_FIXED = cn('motivator-fab-shell motivator-fab-shell--fixed')

/** Inline in planner toolbar (desktop), aligned with filters. */
export const FAB_SHELL_INLINE = cn('motivator-fab-shell-inline shrink-0')

export const FAB = cn(
  'motivator-fab',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
)

const DRAFT_COUNT_BADGE_BASE = cn(
  'z-10 flex size-6 min-w-6 shrink-0 items-center justify-center rounded-full p-0',
  'border border-tertiary/55 bg-tertiary-container/30 text-[11px] font-bold leading-none tabular-nums text-tertiary',
  'ring-2 ring-background shadow-md',
  'transition-colors hover:bg-tertiary-container/45 disabled:opacity-40',
)

export const TASK_META_CHIP = cn(
  'rounded border border-outline-variant bg-surface-container-highest px-2 py-0.5',
  'text-[10px] font-medium uppercase tracking-wider text-on-surface-variant',
)

export const TASK_GROUP_CHIP = cn(
  TASK_META_CHIP,
  'border-primary/25 bg-primary/10 text-primary',
)

export const TASK_OVERDUE_CHIP = cn(
  TASK_META_CHIP,
  'border-tertiary/40 bg-tertiary-container/15 text-tertiary',
)

export const TASK_CARD_SHELL = cn(
  'rounded-card border border-l-4 transition-colors',
)

export const TASK_CARD_BODY = 'flex items-start gap-3 p-sm md:p-md'

export const SETTINGS_CHECKBOX_ROW = cn(
  'flex cursor-pointer items-start gap-2 rounded-card border border-surface-variant',
  'bg-surface-container-low p-sm',
)

export function periodBreakdownToggle(active: boolean): string {
  return cn(
    'rounded-lg border px-2 py-1 text-label-sm',
    active
      ? 'border-primary bg-primary/15 text-primary'
      : 'border-surface-variant text-on-surface-variant hover:bg-surface-container',
  )
}

export function weekdayToggle(active: boolean): string {
  return periodBreakdownToggle(active)
}

export const PLANNER_NAV_BTN = cn(
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-surface-variant p-2 text-on-surface',
  'transition-colors hover:bg-surface-container active:scale-95 disabled:opacity-40',
)

/** Стрелки «пред./след.» в `PlannerPeriodNav` — на desktop как кнопка «Сегодня», на mobile — 44px. */
export const PLANNER_PERIOD_ARROW_BTN = cn(
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-surface-variant p-1.5 text-on-surface',
  'transition-colors hover:bg-surface-container active:scale-95 disabled:opacity-40',
  'max-md:min-h-11 max-md:min-w-11 max-md:p-2',
)

export const MOTIVATOR_INPUT = cn(
  'motivator-input w-full min-h-[2.5rem] px-3 py-2 text-body-sm disabled:opacity-40',
)

export const SETTINGS_BTN_SECONDARY = cn(
  'rounded-lg border border-surface-variant bg-surface-container-high px-3 py-2',
  'text-body-sm text-on-surface transition-colors hover:bg-surface-container-highest disabled:opacity-40',
)

/** Compact toolbar control on planner (filters, EOD) — 44px height on mobile. */
export const PLANNER_TOOLBAR_BTN = cn(
  SETTINGS_BTN_SECONDARY,
  'max-md:min-h-11 max-md:items-center max-md:px-3 max-md:py-2',
)

export const CHART_CARD_SHELL = cn(
  'motivator-card flex flex-col items-center gap-1 p-sm md:px-md md:py-3',
  'lg:border-surface-variant/80 lg:bg-surface-container-low/50',
)

export const CHART_CARD_TITLE = 'text-label-sm text-center uppercase text-on-surface-variant'

export const CHART_BREAKDOWN_SHELL = cn(
  'motivator-card w-full min-w-0 p-sm md:p-md lg:border-surface-variant/80 lg:bg-surface-container-low/50',
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
    'min-w-0 flex-1 rounded-md px-1.5 py-2 text-center text-label-sm leading-tight transition-colors max-md:min-h-11 max-md:flex max-md:items-center max-md:justify-center sm:px-3',
    active
      ? 'bg-surface-container-highest text-primary shadow-sm ring-1 ring-primary/30'
      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  )
}

export const MODAL_SHELL = cn(
  'flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card',
  'border border-surface-variant bg-surface-container-lowest shadow-2xl sm:max-h-[min(90vh,800px)]',
)

export const MODAL_HEADER = cn(
  'flex shrink-0 items-start justify-between gap-2 border-b border-surface-variant p-sm pb-3 pt-4 md:px-md',
  'max-md:pt-[max(1rem,env(safe-area-inset-top))]',
)

export const MODAL_FOOTER = cn(
  'shrink-0 border-t border-surface-variant bg-surface-container-lowest px-sm pt-3 md:px-md',
  'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
)

export const MODAL_TITLE = 'text-label-md font-semibold text-on-surface'

export const MODAL_CLOSE_BTN = cn(
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface',
)

/** Icon-only control in shell header — 44×44px touch target (Design 2.0 / stage 7). */
export const SHELL_ICON_BTN = cn(
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors active:scale-95',
)

export const FIELD_LABEL = SETTINGS_LABEL

export const FIELDSET = 'rounded-card border border-surface-variant p-sm'

export const FIELDSET_LEGEND = 'px-1 text-label-sm text-on-surface-variant'

export const FILTER_PANEL = cn(
  'rounded-card border border-surface-variant bg-surface-container-low shadow-inner',
  'max-md:fixed max-md:inset-0 max-md:z-[45] max-md:flex max-md:flex-col max-md:overflow-hidden',
  'max-md:rounded-none max-md:border-0 max-md:bg-surface-container-lowest max-md:p-0 md:p-md',
)

export const DRAFT_LIST_ITEM = cn(
  'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-variant',
  'bg-surface-container-low px-3 py-2 text-body-sm',
)

export const CHECKBOX_INPUT = cn('motivator-checkbox h-3.5 w-3.5 shrink-0')

/** Main completion toggle on task cards — 44px touch target wraps the control. */
export const TASK_CHECKBOX_MAIN = cn('motivator-checkbox h-6 w-6 shrink-0 md:h-5 md:w-5')

/** Checklist row toggle on task cards. */
export const TASK_CHECKBOX_CHECKLIST = cn('motivator-checkbox h-4 w-4 shrink-0')

export const PLANNER_SECTION_HEAD = cn(
  'mb-3 text-label-sm font-semibold uppercase text-on-surface-variant',
)

export const EMPTY_STATE_BOX = cn(
  'rounded-card border border-dashed border-surface-variant p-sm py-8 text-center text-body-sm text-on-surface-variant',
)

export const MODAL_OVERLAY = 'fixed inset-0 z-[60] flex items-end justify-center glass-overlay p-4 sm:items-center'

export const PLAN_ACCORDION = cn(
  'plan-accordion group mt-4 rounded-card border border-surface-variant',
  'bg-surface-container-low open:border-primary/30',
)

export const PLAN_ACCORDION_SUMMARY = cn(
  'flex cursor-pointer list-none items-center justify-between gap-3 rounded-card p-sm',
  'transition-colors hover:bg-surface-container [&::-webkit-details-marker]:hidden',
)

/** Inline warning callout — tertiary semantic, not Tailwind amber */
export const ALERT_WARNING = cn('motivator-alert-warning rounded-card p-sm')

export const ALERT_WARNING_MUTED = cn('motivator-alert-warning-muted rounded-card p-sm')

export const ALERT_WARNING_TITLE = 'text-body-sm font-semibold motivator-alert-warning-title'

export const ALERT_WARNING_BODY = 'text-body-sm motivator-alert-warning-body'

/** Small inline hint (estimate warnings, settings hints) */
export const TEXT_HINT_WARNING = 'text-label-sm text-tertiary'

export const TEXT_LINK_IN_HINT = 'text-primary underline hover:text-primary-fixed-dim'

export const AUTH_PAGE_HEADER = cn(
  'sticky top-0 z-50 flex min-h-16 items-center justify-between border-b border-surface-variant bg-background/90 px-4 backdrop-blur-sm md:px-10',
  'pt-[env(safe-area-inset-top,0px)]',
)

export const AUTH_GLASS_CARD = cn(
  'glass-panel relative z-10 w-full rounded-card shadow-2xl',
)

export const MODAL_SHELL_WIDE = cn(
  MODAL_SHELL,
  'max-w-[min(100vw-1.5rem,800px)] md:max-w-4xl lg:max-w-5xl md:max-h-[min(88vh,900px)] md:flex-row',
)

export const ROADMAP_ACCENT_SHIPPED = 'text-primary/90'

export const ROADMAP_ACCENT_NEUTRAL = 'text-on-surface-variant'

export const ROADMAP_SECTION_SUMMARY = cn(
  'flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-3',
  'text-label-sm font-semibold text-on-surface-variant hover:bg-surface-container-low/80',
)

export const ROADMAP_DETAILS_SUMMARY = cn(
  'flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5',
  'text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-low/55',
)

/** Overlay on «Создать задачу» (desktop / week-month toolbar). */
export const DRAFT_COUNT_BADGE = cn(DRAFT_COUNT_BADGE_BASE, 'absolute -right-2 -top-2')

export const DC_PENDING_SHELL = cn(
  'animate-dc-pending border-primary/40 bg-surface-container ring-1 ring-primary/25',
)

export const DC_PENDING_CHIP = cn(TASK_META_CHIP, 'border-primary/40 text-primary')

/** Settings — vertical tab (desktop) / horizontal chip row (mobile), Stitch settings_privacy_security */
export function settingsTabButton(active: boolean): string {
  return cn(
    'flex min-h-[44px] shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
    active
      ? 'bg-primary/10 font-semibold text-primary ring-1 ring-primary/30 lg:border-l-2 lg:border-primary lg:ring-0'
      : 'text-on-surface-variant hover:bg-surface-container',
  )
}

export const SETTINGS_TAB_PANEL_TITLE = 'text-headline-md font-display font-semibold text-on-surface'

export const SETTINGS_TAB_PANEL_INTRO = 'mt-1 text-body-sm text-on-surface-variant'

/** Sticky app header title — DESIGN.md headline-md, primary accent */
export const SHELL_PAGE_TITLE = cn(
  'min-w-0 truncate text-headline-md font-semibold text-primary',
)

export const SHELL_HEADER = cn(
  'sticky top-0 z-40 flex min-h-16 shrink-0 items-center justify-between gap-sm',
  'border-b border-surface-variant bg-background/95 px-margin-mobile backdrop-blur-sm md:px-xl',
  'pt-[env(safe-area-inset-top,0px)]',
)

export const SHELL_HEADER_ACTIONS = 'flex min-w-0 shrink-0 items-center gap-xs sm:gap-sm'

export function shellMainContent(wide: boolean): string {
  return cn(
    'mx-auto w-full min-w-0 flex-1 px-margin-mobile py-sm md:px-xl md:py-lg',
    'max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]',
    wide ? 'max-w-desktop' : 'max-w-5xl',
  )
}

export function shellSideNavLink(isActive: boolean): string {
  return cn(
    'flex min-h-[44px] items-center gap-4 rounded px-md py-3 text-label-md transition-all duration-200',
    isActive
      ? 'translate-x-0.5 border-r-2 border-primary bg-surface-container-high font-semibold text-primary'
      : 'text-on-surface-variant hover:translate-x-0.5 hover:bg-surface-container-high',
  )
}

export function shellMobileNavLink(isActive: boolean): string {
  return cn(
    'flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5',
    'px-1 py-2 text-label-sm transition-colors',
    isActive ? 'text-primary' : 'text-on-surface-variant',
  )
}

export const SHELL_BOTTOM_NAV = cn(
  'fixed inset-x-0 bottom-0 z-50 flex h-20 border-t border-surface-variant',
  'bg-surface-container-low/95 backdrop-blur-md md:hidden',
  'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
)

export const SHELL_SIDEBAR = cn(
  'fixed left-0 top-0 z-50 hidden h-dvh w-64 flex-col border-r border-surface-variant',
  'bg-surface pt-md pb-lg md:flex',
)

export const SHELL_PLAN_BADGE = cn(
  'inline-flex rounded border px-1.5 py-0.5 text-label-sm uppercase tracking-wide',
)

export const SHELL_UPGRADE_STUB = cn(
  'mt-sm rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2.5 text-center',
)

export const SHELL_VERSION_FOOTER = 'mt-md text-mono-data text-on-surface-variant/60'

