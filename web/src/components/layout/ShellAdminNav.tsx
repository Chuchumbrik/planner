import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { shellSideNavLink } from '@/lib/designClasses'
import { SHELL_ADMIN_NAV } from '@/lib/shellNavigation'

type Props = {
  onNavigate?: () => void
}

export function ShellAdminNav({ onNavigate }: Props) {
  const { t } = useTranslation()
  const location = useLocation()

  function isItemActive(item: (typeof SHELL_ADMIN_NAV)[number]): boolean {
    if (item.id === 'admin-dashboard') {
      return location.pathname === '/prototype/admin-dashboard'
    }
    if (item.id === 'admin-users') {
      return location.pathname === '/admin/access'
    }
    if (item.id === 'admin-roadmap') {
      return location.pathname === '/admin/roadmap'
    }
    return false
  }

  return (
    <>
      <NavLink
        to="/app"
        className={({ isActive }) =>
          cn(shellSideNavLink(isActive), 'mb-1 text-on-surface-variant hover:text-on-surface')
        }
        onClick={onNavigate}
      >
        <MaterialIcon name="arrow_back" size={22} />
        <span>{t('shell.adminBackToApp')}</span>
      </NavLink>

      <p className="mt-sm px-4 pb-1 text-label-sm uppercase tracking-wide text-on-surface-variant/80">
        {t('shell.adminNavSection')}
      </p>

      {SHELL_ADMIN_NAV.map((item) => {
        const active = isItemActive(item)
        return (
          <NavLink
            key={item.id}
            to={item.to!}
            className={() => shellSideNavLink(active)}
            onClick={onNavigate}
          >
            <MaterialIcon name={item.icon} size={22} />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        )
      })}
    </>
  )
}
