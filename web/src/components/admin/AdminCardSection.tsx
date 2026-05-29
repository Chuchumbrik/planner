import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SETTINGS_CARD, ADMIN_CARD_BODY } from '@/lib/designClasses'
import { cn } from '@/lib/cn'

type Props = {
  title: string
  hint?: string
  hint2?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  collapsible?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** Optional id for the collapsible body — used for `aria-controls`. */
  bodyId?: string
}

export function AdminCardSection({
  title,
  hint,
  hint2,
  action,
  children,
  className,
  collapsible,
  collapsed,
  onToggleCollapse,
  bodyId,
}: Props) {
  const { t } = useTranslation()
  return (
    <section className={cn(SETTINGS_CARD, className)}>
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-semibold text-on-surface">{title}</h3>
          {!collapsed && hint ? (
            <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>
          ) : null}
          {!collapsed && hint2 ? (
            <p className="mt-1 text-xs text-on-surface-variant/70">{hint2}</p>
          ) : null}
        </div>
        {(!collapsed && action) || collapsible ? (
          <div className="flex shrink-0 items-center gap-1">
            {!collapsed && action ? <div className="shrink-0">{action}</div> : null}
            {collapsible ? (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                onClick={onToggleCollapse}
                aria-expanded={!collapsed}
                aria-controls={bodyId}
                aria-label={collapsed ? t('common.expand') : t('common.collapse')}
              >
                <MaterialIcon name={collapsed ? 'expand_more' : 'expand_less'} size={18} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {!collapsed ? (
        <div id={bodyId} className={ADMIN_CARD_BODY}>
          {children}
        </div>
      ) : null}
    </section>
  )
}
