import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { shellSideNavLink } from '@/lib/designClasses'
import { shellAdminNavForUser } from '@/lib/shellNavigation'

type Props = {
  onNavigate?: () => void
  isAdmin: boolean
}

export function ShellAdminNav({ onNavigate, isAdmin }: Props) {
  const { t } = useTranslation()
  const location = useLocation()
  const items = shellAdminNavForUser(isAdmin)

  function isItemActive(item: (typeof items)[number]): boolean {
    if (item.id === 'admin-dashboard') {
      return location.pathname === '/prototype/admin-dashboard'
    }
    if (item.id === 'admin-users') {
      return location.pathname === '/admin/access'
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

      {items.map((item) => {
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
