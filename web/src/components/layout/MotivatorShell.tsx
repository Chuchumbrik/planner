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
import { QaClockBanner } from '@/components/qa/QaClockBanner'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  SHELL_BOTTOM_NAV,
  SHELL_HEADER,
  SHELL_HEADER_ACTIONS,
  SHELL_PAGE_TITLE,
  shellMainContent,
  type ShellMainAlign,
  shellMainOffsetClass,
  shellMobileNavLink,
  shellSidebarClass,
  shellSideNavLink,
} from '@/lib/designClasses'
import {
  readShellSidebarCollapsed,
  writeShellSidebarCollapsed,
} from '@/lib/shellSidebarStorage'
import { isShellAdminMode } from '@/lib/shellAdminMode'
import { getPlanTier, type PlanTier } from '@/lib/planTier'
import {
  SHELL_MAIN_NAV,
  shellPreviewNavForUser,
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
  /** 'center' (default) for regular pages, 'left' for data-dense admin views. */
  align?: ShellMainAlign
  planTier?: PlanTier
}

function ShellNavLinks({
  activeNav,
  onNavigate,
  items,
  collapsed,
}: {
  activeNav: MotivatorNavId
  onNavigate?: () => void
  items: ShellNavItem[]
  collapsed: boolean
}) {
  const { t } = useTranslation()

  return (
    <>
      {items.map((item) => {
        const label = t(item.labelKey)
        const isActive = activeNav === item.id
        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive: navActive }) =>
              shellSideNavLink(navActive || isActive, collapsed)
            }
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            onClick={onNavigate}
          >
            <MaterialIcon name={item.icon} size={22} />
            <span className={collapsed ? 'sr-only' : undefined}>{label}</span>
          </NavLink>
        )
      })}
    </>
  )
}

function ShellSidebar({
  activeNav,
  onNavigate,
  className,
  showPreviewNav,
  adminMode,
  isAdmin,
  collapsed,
  onToggleCollapsed,
  showCollapseToggle,
}: {
  activeNav: MotivatorNavId
  onNavigate?: () => void
  className?: string
  showPreviewNav: boolean
  adminMode: boolean
  isAdmin: boolean
  collapsed: boolean
  onToggleCollapsed?: () => void
  showCollapseToggle?: boolean
}) {
  const { t } = useTranslation()
  const settingsActive = activeNav === 'settings'
  const settingsLabel = t(SHELL_SETTINGS_NAV.labelKey)

  return (
    <aside className={cn(shellSidebarClass(collapsed), className)}>
      <div className={cn('mb-md', collapsed ? 'flex justify-center px-2' : 'px-md')}>
        {collapsed ? (
          <p
            className="font-display text-lg font-bold text-primary"
            title={t('shell.brandSubtitle')}
            aria-hidden
          >
            M
          </p>
        ) : (
          <BrandMark size="sm" showSubtitle />
        )}
      </div>

      {/* Collapse handle — small floating arrow button sitting ON the right
          border of the sidebar, between brand title and first nav item.
          Centered on the border line via `translate-x-1/2`. Hidden on mobile. */}
      {showCollapseToggle && onToggleCollapsed ? (
        <button
          type="button"
          className={cn(
            'absolute right-0 top-14 z-[55] hidden translate-x-1/2 md:flex',
            'h-6 w-6 items-center justify-center rounded-full border border-surface-variant',
            'bg-surface text-on-surface-variant shadow-sm transition-colors',
            'hover:border-primary/50 hover:text-primary',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          )}
          aria-label={collapsed ? t('shell.sidebarExpand') : t('shell.sidebarCollapse')}
          title={collapsed ? t('shell.sidebarExpand') : t('shell.sidebarCollapse')}
          onClick={onToggleCollapsed}
        >
          <MaterialIcon name={collapsed ? 'chevron_right' : 'chevron_left'} size={16} />
        </button>
      ) : null}

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-sm"
        aria-label={adminMode ? t('shell.adminNavAria') : t('shell.sideNavAria')}
      >
        {adminMode ? (
          <ShellAdminNav onNavigate={onNavigate} isAdmin={isAdmin} collapsed={collapsed} />
        ) : (
          <>
            <ShellNavLinks
              activeNav={activeNav}
              items={SHELL_MAIN_NAV}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
            {showPreviewNav ? (
              <>
                {!collapsed ? (
                  <p className="mt-4 px-4 pb-1 text-label-sm uppercase tracking-wide text-on-surface-variant/80">
                    {t('shell.navPreviews')}
                  </p>
                ) : null}
                <ShellNavLinks
                  activeNav={activeNav}
                  items={shellPreviewNavForUser(isAdmin)}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                />
              </>
            ) : null}
          </>
        )}

        {/* Settings — always visible at the bottom, regardless of nav mode
            (main / admin / preview). Globally available shortcut. */}
        <div className="mt-auto border-t border-surface-variant/60 py-3">
          <NavLink
            to={SHELL_SETTINGS_NAV.to}
            className={({ isActive }) =>
              shellSideNavLink(isActive || settingsActive, collapsed)
            }
            title={collapsed ? settingsLabel : undefined}
            aria-label={collapsed ? settingsLabel : undefined}
            onClick={onNavigate}
          >
            <MaterialIcon name={SHELL_SETTINGS_NAV.icon} size={22} />
            <span className={collapsed ? 'sr-only' : undefined}>{settingsLabel}</span>
          </NavLink>
        </div>
      </nav>

      <ShellAccountFooter collapsed={collapsed} />
    </aside>
  )
}

function MotivatorShellInner({
  activeNav,
  title,
  children,
  wide = false,
  align = 'center',
  planTier: planTierProp,
}: MotivatorShellProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const planTier = planTierProp ?? getPlanTier()
  const pageTitle = title ?? t(shellTitleKey(activeNav))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readShellSidebarCollapsed)
  const settingsActive = activeNav === 'settings'
  const { canAccessPreviewFeatures, isAdmin } = useAuth()
  const { closeAssistant } = useAiAssistant()
  const isDesktop = useIsDesktopShell()
  const adminMode = isShellAdminMode(location.pathname, location.hash, {
    isAdmin,
    canAccessQaTools: canAccessPreviewFeatures,
  })
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

  const desktopSidebarCollapsed = isDesktop && sidebarCollapsed

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      writeShellSidebarCollapsed(next)
      return next
    })
  }

  const sidebarProps = {
    activeNav,
    showPreviewNav: canAccessPreviewFeatures,
    adminMode,
    isAdmin,
    collapsed: desktopSidebarCollapsed,
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-on-surface">
      <ShellSidebar
        {...sidebarProps}
        className="max-md:hidden"
        showCollapseToggle
        onToggleCollapsed={toggleSidebarCollapsed}
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
            {...sidebarProps}
            collapsed={false}
            className="z-[56] flex md:hidden"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </>
      ) : null}

      <div
        className={cn(
          'flex min-h-dvh min-w-0 transition-[margin] duration-200 ease-out',
          shellMainOffsetClass(desktopSidebarCollapsed),
          canAccessPreviewFeatures && isDesktop && 'md:flex-row',
        )}
      >
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
              {canAccessPreviewFeatures && isDesktop ? (
                <AiAssistantTrigger variant="header" />
              ) : null}
              <ShellHeaderActions planTier={planTier} />
            </div>
          </header>

          <main className={shellMainContent(wide, align)}>
            <QaClockBanner />
            {children}
          </main>

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

        {canAccessPreviewFeatures && isDesktop ? <AiAssistantPanel mode="docked" /> : null}
      </div>

      {canAccessPreviewFeatures && !isDesktop ? (
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
