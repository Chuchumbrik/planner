import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { BrandMark } from '@/components/brand/BrandMark'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  SHELL_BOTTOM_NAV,
  SHELL_HEADER,
  SHELL_HEADER_ACTIONS,
  SHELL_PAGE_TITLE,
  SHELL_PLAN_BADGE,
  SHELL_SIDEBAR,
  SHELL_UPGRADE_BTN,
  SHELL_VERSION_FOOTER,
  shellMainContent,
  shellMobileNavLink,
  shellSideNavLink,
} from '@/lib/designClasses'
import { getPlanTier, type PlanTier } from '@/lib/planTier'
import { APP_VERSION } from '@/version'

export type MotivatorNavId = 'planner' | 'reports' | 'settings'

type MotivatorShellProps = {
  activeNav: MotivatorNavId
  title?: string
  headerActions?: ReactNode
  children: ReactNode
  /** Full 1200px content width (planner, reports, settings). */
  wide?: boolean
  /** Override plan badge (default from getPlanTier). */
  planTier?: PlanTier
}

const NAV_ITEMS: { id: MotivatorNavId; to: string; icon: string; labelKey: string }[] = [
  { id: 'planner', to: '/app', icon: 'event_note', labelKey: 'shell.navPlanner' },
  { id: 'reports', to: '/app/reports', icon: 'analytics', labelKey: 'shell.navReports' },
  { id: 'settings', to: '/settings', icon: 'settings', labelKey: 'shell.navSettings' },
]

function PlanSidebarFooter({ tier }: { tier: PlanTier }) {
  const { t } = useTranslation()
  const isPremium = tier === 'premium'
  const upgradeHintId = 'shell-plan-upgrade-hint'

  return (
    <div className="mt-auto border-t border-surface-variant/80 px-md pt-md">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-surface-container-high',
            isPremium ? 'border-primary/50' : 'border-outline-variant',
          )}
          aria-hidden
        >
          <MaterialIcon
            name={isPremium ? 'workspace_premium' : 'person'}
            className={isPremium ? 'text-primary' : 'text-on-surface-variant'}
            size={20}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-md text-on-surface">{t('shell.vaultLocked')}</p>
          <p className="mt-0.5">
            <span
              className={cn(
                SHELL_PLAN_BADGE,
                isPremium
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-outline-variant text-on-surface-variant',
              )}
            >
              {isPremium ? t('shell.planPremium') : t('shell.planFree')}
            </span>
          </p>
        </div>
      </div>
      {!isPremium ? (
        <>
          <p id={upgradeHintId} className="sr-only">
            {t('shell.planUpgradeHint')}
          </p>
          <button
            type="button"
            disabled
            title={t('shell.planUpgradeHint')}
            aria-describedby={upgradeHintId}
            className={SHELL_UPGRADE_BTN}
          >
            {t('shell.planUpgrade')}
          </button>
        </>
      ) : null}
      <p className={SHELL_VERSION_FOOTER}>{t('home.badge', { version: APP_VERSION })}</p>
    </div>
  )
}

export function MotivatorShell({
  activeNav,
  title,
  headerActions,
  children,
  wide = false,
  planTier: planTierProp,
}: MotivatorShellProps) {
  const { t } = useTranslation()
  const planTier = planTierProp ?? getPlanTier()
  const pageTitle = title ?? t(`shell.title.${activeNav}`)

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-on-surface">
      <aside className={SHELL_SIDEBAR}>
        <div className="mb-xl px-md">
          <BrandMark size="sm" showSubtitle />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-sm" aria-label={t('shell.sideNavAria')}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => shellSideNavLink(isActive || activeNav === item.id)}
              end={item.id === 'planner'}
            >
              <MaterialIcon name={item.icon} size={22} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <PlanSidebarFooter tier={planTier} />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col md:ml-64">
        <header className={SHELL_HEADER}>
          <h1 className={SHELL_PAGE_TITLE}>{pageTitle}</h1>
          {headerActions ? (
            <div className={SHELL_HEADER_ACTIONS}>{headerActions}</div>
          ) : null}
        </header>

        <main className={shellMainContent(wide)}>{children}</main>
      </div>

      <nav className={SHELL_BOTTOM_NAV} aria-label={t('shell.bottomNavAria')}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive: navActive }) => shellMobileNavLink(navActive || isActive)}
              end={item.id === 'planner'}
            >
              <MaterialIcon name={item.icon} size={24} filled={isActive} />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
