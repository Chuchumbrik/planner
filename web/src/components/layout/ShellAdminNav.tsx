import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { ProductRoadmapModal } from '@/components/ProductRoadmapModal'
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
  const [roadmapOpen, setRoadmapOpen] = useState(false)

  function isItemActive(item: (typeof SHELL_ADMIN_NAV)[number]): boolean {
    if (item.action === 'roadmap') return false
    if (item.id === 'admin-dashboard') {
      return location.pathname === '/prototype/admin-dashboard'
    }
    if (item.id === 'admin-users') {
      return location.pathname === '/settings' && location.hash.replace(/^#/, '') === 'admin'
    }
    return false
  }

  return (
    <>
      <NavLink
        to="/app"
        className={({ isActive }) =>
          cn(
            shellSideNavLink(isActive),
            'mb-1 text-on-surface-variant hover:text-on-surface',
          )
        }
        onClick={onNavigate}
      >
        <MaterialIcon name="arrow_back" size={22} />
        <span>{t('shell.adminBackToApp')}</span>
      </NavLink>

      <p className="mt-4 px-4 pb-1 text-label-sm uppercase tracking-wide text-on-surface-variant/80">
        {t('shell.adminNavSection')}
      </p>

      {SHELL_ADMIN_NAV.map((item) => {
        if (item.action === 'roadmap') {
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                shellSideNavLink(false),
                'w-full text-left text-on-surface-variant hover:bg-surface-container-high',
              )}
              onClick={() => {
                onNavigate?.()
                setRoadmapOpen(true)
              }}
            >
              <MaterialIcon name={item.icon} size={22} />
              <span>{t(item.labelKey)}</span>
            </button>
          )
        }

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

      <ProductRoadmapModal open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
    </>
  )
}
