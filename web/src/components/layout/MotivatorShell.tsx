import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AiAssistantPanel } from '@/components/ai/AiAssistantPanel'
import { AiAssistantProvider, useAiAssistant } from '@/components/ai/AiAssistantContext'
import { AiAssistantTrigger } from '@/components/ai/AiAssistantTrigger'
import { BrandMark } from '@/components/brand/BrandMark'
import { ShellHeaderActions } from '@/components/layout/ShellHeaderActions'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  SHELL_BOTTOM_NAV,
  SHELL_HEADER,
  SHELL_HEADER_ACTIONS,
  SHELL_PAGE_TITLE,
  SHELL_PLAN_BADGE,
  SHELL_SIDEBAR,
  SHELL_UPGRADE_STUB,
  SHELL_VERSION_FOOTER,
  shellMainContent,
  shellMobileNavLink,
  shellSideNavLink,
} from '@/lib/designClasses'
import { getPlanTier, type PlanTier } from '@/lib/planTier'
import {
  SHELL_MAIN_NAV,
  SHELL_PREVIEW_NAV,
  SHELL_SETTINGS_NAV,
  shellTitleKey,
  type MotivatorNavId,
  type ShellNavItem,
} from '@/lib/shellNavigation'
import { APP_VERSION } from '@/version'

type MotivatorShellProps = {
  activeNav: MotivatorNavId
  title?: string
  children: ReactNode
  /** Full 1200px content width (planner, reports, settings). */
  wide?: boolean
  /** Override plan badge (default from getPlanTier). */
  planTier?: PlanTier
}

function PlanSidebarFooter({ tier }: { tier: PlanTier }) {
  const { t } = useTranslation()
  const isPremium = tier === 'premium'

  return (
    <div className="border-t border-surface-variant/80 px-md pt-md">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-surface-container-high',
            isPremium ? 'border-primary/50' : 'border-outline-variant',
          )}
          aria-hidden
        >
          <MaterialIcon
            name={isPremium ? 'workspace_premium' : 'shield'}
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
        <div className={SHELL_UPGRADE_STUB} aria-label={t('shell.planUpgradeHint')}>
          <p className="text-label-sm text-on-surface-variant">{t('shell.planUpgrade')}</p>
          <p className="mt-0.5 text-label-sm font-medium text-primary">{t('shell.planComingSoon')}</p>
        </div>
      ) : null}
      <p className={SHELL_VERSION_FOOTER}>{t('home.badge', { version: APP_VERSION })}</p>
    </div>
  )
}

function ShellNavLinks({
  activeNav,
  onNavigate,
  items,
}: {
  activeNav: MotivatorNavId
  onNavigate?: () => void
  items: ShellNavItem[]
}) {
  const { t } = useTranslation()

  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.end}
          className={({ isActive }) => shellSideNavLink(isActive || activeNav === item.id)}
          onClick={onNavigate}
        >
          <MaterialIcon name={item.icon} size={22} />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </>
  )
}

function ShellSidebar({
  activeNav,
  planTier,
  onNavigate,
  className,
  showPreviewNav,
}: {
  activeNav: MotivatorNavId
  planTier: PlanTier
  onNavigate?: () => void
  className?: string
  showPreviewNav: boolean
}) {
  const { t } = useTranslation()
  const settingsActive = activeNav === 'settings'

  return (
    <aside className={cn(SHELL_SIDEBAR, className)}>
      <div className="mb-xl px-md">
        <BrandMark size="sm" showSubtitle />
      </div>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-sm"
        aria-label={t('shell.sideNavAria')}
      >
        <ShellNavLinks activeNav={activeNav} items={SHELL_MAIN_NAV} onNavigate={onNavigate} />
        {showPreviewNav ? (
          <>
            <AiAssistantTrigger variant="sidebar" className="mt-1" />
            <p className="mt-4 px-4 pb-1 text-label-sm uppercase tracking-wide text-on-surface-variant/80">
              {t('shell.navPreviews')}
            </p>
            <ShellNavLinks activeNav={activeNav} items={SHELL_PREVIEW_NAV} onNavigate={onNavigate} />
          </>
        ) : null}
        <div className="mt-auto border-t border-surface-variant/60 pt-3">
          <NavLink
            to={SHELL_SETTINGS_NAV.to}
            className={({ isActive }) =>
              shellSideNavLink(isActive || settingsActive)
            }
            onClick={onNavigate}
          >
            <MaterialIcon name={SHELL_SETTINGS_NAV.icon} size={22} />
            <span>{t(SHELL_SETTINGS_NAV.labelKey)}</span>
          </NavLink>
        </div>
      </nav>
      <PlanSidebarFooter tier={planTier} />
    </aside>
  )
}

function MotivatorShellInner({
  activeNav,
  title,
  children,
  wide = false,
  planTier: planTierProp,
}: MotivatorShellProps) {
  const { t } = useTranslation()
  const planTier = planTierProp ?? getPlanTier()
  const pageTitle = title ?? t(shellTitleKey(activeNav))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const settingsActive = activeNav === 'settings'
  const { canAccessPreviewFeatures } = useAuth()
  const { closeAssistant } = useAiAssistant()

  useEffect(() => {
    if (!canAccessPreviewFeatures) closeAssistant()
  }, [canAccessPreviewFeatures, closeAssistant])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [activeNav])

  useEffect(() => {
    if (!mobileNavOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-on-surface">
      <ShellSidebar
        activeNav={activeNav}
        planTier={planTier}
        className="max-md:hidden"
        showPreviewNav={canAccessPreviewFeatures}
      />

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/65 md:hidden"
            aria-label={t('shell.menuClose')}
            onClick={() => setMobileNavOpen(false)}
          />
          <ShellSidebar
            activeNav={activeNav}
            planTier={planTier}
            className="z-[56] flex md:hidden"
            onNavigate={() => setMobileNavOpen(false)}
            showPreviewNav={canAccessPreviewFeatures}
          />
        </>
      ) : null}

      <div className="flex min-h-dvh min-w-0 flex-col md:ml-64">
        <header className={SHELL_HEADER}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-container md:hidden"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? t('shell.menuClose') : t('shell.menuOpen')}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <MaterialIcon name={mobileNavOpen ? 'close' : 'menu'} size={24} />
            </button>
            <h1 className={SHELL_PAGE_TITLE}>{pageTitle}</h1>
          </div>
          <div className={SHELL_HEADER_ACTIONS}>
            {canAccessPreviewFeatures ? <AiAssistantTrigger variant="header" /> : null}
            <ShellHeaderActions />
          </div>
        </header>

        <main className={shellMainContent(wide)}>{children}</main>
      </div>

      <nav className={SHELL_BOTTOM_NAV} aria-label={t('shell.bottomNavAria')}>
        {SHELL_MAIN_NAV.map((item) => {
          const isActive = activeNav === item.id
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive: navActive }) => shellMobileNavLink(navActive || isActive)}
              end={item.end}
            >
              <MaterialIcon name={item.icon} size={24} filled={isActive} />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
        {canAccessPreviewFeatures ? <AiAssistantTrigger variant="bottomNav" /> : null}
        <NavLink
          to={SHELL_SETTINGS_NAV.to}
          className={({ isActive }) => shellMobileNavLink(isActive || settingsActive)}
        >
          <MaterialIcon name={SHELL_SETTINGS_NAV.icon} size={24} filled={settingsActive} />
          <span className="max-w-full truncate">{t(SHELL_SETTINGS_NAV.labelKey)}</span>
        </NavLink>
      </nav>

      {canAccessPreviewFeatures ? <AiAssistantPanel /> : null}
    </div>
  )
}

export function MotivatorShell(props: MotivatorShellProps) {
  return (
    <AiAssistantProvider>
      <MotivatorShellInner {...props} />
    </AiAssistantProvider>
  )
}
