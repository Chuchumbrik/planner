import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { BrandMark } from '@/components/brand/BrandMark'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { getPlanTier, type PlanTier } from '@/lib/planTier'
import { APP_VERSION } from '@/version'

export type MotivatorNavId = 'planner' | 'reports' | 'settings'

type MotivatorShellProps = {
  activeNav: MotivatorNavId
  title?: string
  headerActions?: ReactNode
  children: ReactNode
  wide?: boolean
  /** Override plan badge (default from getPlanTier). */
  planTier?: PlanTier
}

const NAV_ITEMS: { id: MotivatorNavId; to: string; icon: string; labelKey: string }[] = [
  { id: 'planner', to: '/app', icon: 'event_note', labelKey: 'shell.navPlanner' },
  { id: 'reports', to: '/app/reports', icon: 'analytics', labelKey: 'shell.navReports' },
  { id: 'settings', to: '/settings', icon: 'settings', labelKey: 'shell.navSettings' },
]

function sideNavClass(isActive: boolean): string {
  return cn(
    'flex items-center gap-4 rounded px-4 py-3 font-display text-sm font-medium transition-all duration-200',
    isActive
      ? 'border-r-2 border-primary bg-surface-container-high font-bold text-primary'
      : 'text-on-surface-variant hover:translate-x-0.5 hover:bg-surface-container-high',
  )
}

function mobileNavClass(isActive: boolean): string {
  return cn(
    'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 font-display text-[10px] font-medium sm:text-xs',
    isActive ? 'text-primary' : 'text-on-surface-variant',
  )
}

function PlanSidebarFooter({ tier }: { tier: PlanTier }) {
  const { t } = useTranslation()
  const isPremium = tier === 'premium'

  return (
    <div className="mt-auto border-t border-surface-variant/80 px-6 pt-6">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-surface-container-high',
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
          <p className="truncate font-display text-sm font-medium text-on-surface">
            {t('shell.vaultLocked')}
          </p>
          <p className="font-display text-xs text-on-surface-variant">
            <span
              className={cn(
                'inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
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
        <button
          type="button"
          disabled
          title={t('shell.planUpgradeHint')}
          className="btn-primary mt-4 w-full py-2 text-xs opacity-60"
        >
          {t('shell.planUpgrade')}
        </button>
      ) : null}
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

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-surface-variant bg-surface py-10 md:flex">
        <div className="mb-10 px-6">
          <BrandMark size="sm" showSubtitle showVersion version={APP_VERSION} />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-4" aria-label={t('shell.sideNavAria')}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => sideNavClass(isActive || activeNav === item.id)}
              end={item.id === 'planner'}
            >
              <MaterialIcon name={item.icon} size={22} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <PlanSidebarFooter tier={planTier} />
      </aside>

      <div className="flex min-h-dvh flex-col md:ml-64">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-surface-variant bg-background/95 px-4 backdrop-blur-sm md:px-10">
          <h2 className="min-w-0 truncate font-display text-lg font-bold text-primary md:text-xl">
            {title ?? t(`shell.title.${activeNav}`)}
          </h2>
          {headerActions ? (
            <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
          ) : null}
        </header>

        <main
          className={cn(
            'mx-auto w-full flex-1 px-4 py-6 pb-24 md:px-10 md:py-8 md:pb-8',
            wide ? 'max-w-[1200px]' : 'max-w-6xl',
          )}
        >
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-surface-variant bg-surface-container-low/95 backdrop-blur-md md:hidden"
        aria-label={t('shell.bottomNavAria')}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) => mobileNavClass(isActive || activeNav === item.id)}
            end={item.id === 'planner'}
          >
            <MaterialIcon name={item.icon} size={22} filled={activeNav === item.id} />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
