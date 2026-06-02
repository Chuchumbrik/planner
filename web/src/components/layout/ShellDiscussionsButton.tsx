import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { SHELL_ICON_BTN } from '@/lib/designClasses'
import { UnreadDiscussionsBadge } from './UnreadDiscussionsBadge'

/**
 * Phase 7.10 — точка входа в обсуждения в шапке приложения (в дополнение к
 * пункту бокового меню). Показывается тем, у кого есть доступ к обсуждениям
 * (admin + beta), на любой странице. Несёт `UnreadDiscussionsBadge` —
 * непрочитанные видны не только в админ-разделе.
 */
export function ShellDiscussionsButton() {
  const { t } = useTranslation()
  return (
    <NavLink
      to="/admin/discussions"
      className={({ isActive }) =>
        cn(
          SHELL_ICON_BTN,
          'relative',
          isActive
            ? 'text-primary'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
        )
      }
      title={t('admin.discussions.title')}
      aria-label={t('admin.discussions.title')}
    >
      <MaterialIcon name="forum" size={22} />
      <UnreadDiscussionsBadge />
    </NavLink>
  )
}
