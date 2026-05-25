import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AiAssistantPanel } from '@/components/ai/AiAssistantPanel'
import { AiAssistantProvider, useAiAssistant } from '@/components/ai/AiAssistantContext'
import { AiAssistantTrigger } from '@/components/ai/AiAssistantTrigger'
import { BrandMark } from '@/components/brand/BrandMark'
import { ShellAccountFooter } from '@/components/layout/ShellAccountFooter'
import { ShellAdminNav } from '@/components/layout/ShellAdminNav'
import { ShellHeaderActions } from '@/components/layout/ShellHeaderActions'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  SHELL_BOTTOM_NAV,
  SHELL_HEADER,
  SHELL_HEADER_ACTIONS,
  SHELL_PAGE_TITLE,
  SHELL_SIDEBAR,
  shellMainContent,
  shellMobileNavLink,
  shellSideNavLink,
} from '@/lib/designClasses'
import { isShellAdminMode } from '@/lib/shellAdminMode'
import { getPlanTier, type PlanTier } from '@/lib/planTier'
import {
  SHELL_MAIN_NAV,
  SHELL_PREVIEW_NAV,
  SHELL_SETTINGS_NAV,
  shellTitleKey,
  type MotivatorNavId,
  type ShellNavItem,
} from '@/lib/shellNavigation'
import { useIsDesktopShell } from '@/lib/useMediaQuery'

type MotivatorShellProps = {
  activeNav: MotivatorNavId
  title?: string
  children: ReactNode
  wide?: boolean
  planTier?: PlanTier
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
  onNavigate,
  className,
  showPreviewNav,
  adminMode,
  hideRoadmapInFooter,
}: {
  activeNav: MotivatorNavId
  onNavigate?: () => void
  className?: string
  showPreviewNav: boolean
  adminMode: boolean
  hideRoadmapInFooter: boolean
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
        aria-label={adminMode ? t('shell.adminNavAria') : t('shell.sideNavAria')}
      >
        {adminMode ? (
          <ShellAdminNav onNavigate={onNavigate} />
        ) : (
          <>
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
          </>
        )}
        {!adminMode ? (
          <div className="mt-auto border-t border-surface-variant/60 py-3">
            <NavLink
              to={SHELL_SETTINGS_NAV.to}
              className={({ isActive }) => shellSideNavLink(isActive || settingsActive)}
              onClick={onNavigate}
            >
              <MaterialIcon name={SHELL_SETTINGS_NAV.icon} size={22} />
              <span>{t(SHELL_SETTINGS_NAV.labelKey)}</span>
            </NavLink>
          </div>
        ) : null}
      </nav>
      <ShellAccountFooter hideRoadmap={hideRoadmapInFooter} />
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
  const location = useLocation()
  const planTier = planTierProp ?? getPlanTier()
  const pageTitle = title ?? t(shellTitleKey(activeNav))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const settingsActive = activeNav === 'settings'
  const { canAccessPreviewFeatures, isAdmin } = useAuth()
  const { open: aiOpen, closeAssistant } = useAiAssistant()
  const isDesktop = useIsDesktopShell()
  const adminMode = isShellAdminMode(location.pathname, location.hash, isAdmin)
  const aiDocked = aiOpen && isDesktop && canAccessPreviewFeatures
  const hideRoadmapInFooter = adminMode && isDesktop

  useEffect(() => {
    if (!canAccessPreviewFeatures) closeAssistant()
  }, [canAccessPreviewFeatures, closeAssistant])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [activeNav, location.pathname, location.hash])

  useEffect(() => {
    if (!mobileNavOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  const sidebarProps = {
    activeNav,
    showPreviewNav: canAccessPreviewFeatures,
    adminMode,
    hideRoadmapInFooter,
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-on-surface">
      <ShellSidebar {...sidebarProps} className="max-md:hidden" />

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/65 md:hidden"
            aria-label={t('shell.menuClose')}
            onClick={() => setMobileNavOpen(false)}
          />
          <ShellSidebar
            {...sidebarProps}
            className="z-[56] flex md:hidden"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </>
      ) : null}

      <div className={cn('flex min-h-dvh min-w-0 md:ml-64', aiDocked && 'md:flex-row')}>
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
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
              <ShellHeaderActions planTier={planTier} />
            </div>
          </header>

          <main className={shellMainContent(wide)}>{children}</main>

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
        </div>

        {aiDocked ? <AiAssistantPanel mode="docked" /> : null}
      </div>

      {canAccessPreviewFeatures && aiOpen && !isDesktop ? (
        <AiAssistantPanel mode="overlay" />
      ) : null}
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
