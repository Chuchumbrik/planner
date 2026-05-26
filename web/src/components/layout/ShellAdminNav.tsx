import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { shellSideNavLink } from '@/lib/designClasses'
import { shellAdminNavForUser } from '@/lib/shellNavigation'

type Props = {
  onNavigate?: () => void
  isAdmin: boolean
  collapsed?: boolean
}

export function ShellAdminNav({ onNavigate, isAdmin, collapsed = false }: Props) {
  const { t } = useTranslation()
  const location = useLocation()
  const items = shellAdminNavForUser(isAdmin)

  function isItemActive(item: (typeof items)[number]): boolean {
    if (item.id === 'admin-dashboard') {
      return location.pathname === '/admin/dashboard'
    }
    if (item.id === 'admin-roadmap') {
      return location.pathname === '/admin/roadmap'
    }
    if (item.id === 'admin-testing') {
      return location.pathname === '/admin/testing'
    }
    return false
  }

  return (
    <>
      <NavLink
        to="/app"
        className={({ isActive }) =>
          cn(
            shellSideNavLink(isActive, collapsed),
            'mb-1 text-on-surface-variant hover:text-on-surface',
          )
        }
        title={collapsed ? t('shell.adminBackToApp') : undefined}
        aria-label={collapsed ? t('shell.adminBackToApp') : undefined}
        onClick={onNavigate}
      >
        <MaterialIcon name="arrow_back" size={22} />
        <span className={collapsed ? 'sr-only' : undefined}>{t('shell.adminBackToApp')}</span>
      </NavLink>

      {!collapsed ? (
        <p className="mt-sm px-4 pb-1 text-label-sm uppercase tracking-wide text-on-surface-variant/80">
          {t('shell.adminNavSection')}
        </p>
      ) : null}

      {items.map((item) => {
        const active = isItemActive(item)
        const label = t(item.labelKey)
        return (
          <NavLink
            key={item.id}
            to={item.to!}
            className={() => shellSideNavLink(active, collapsed)}
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
