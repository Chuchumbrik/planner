import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  ADMIN_SECTION_GAP,
  SETTINGS_TAB_PANEL_INTRO,
  SETTINGS_TAB_PANEL_TITLE,
  adminTabButton,
} from '@/lib/designClasses'
import type { AdminDashboardTabId } from '@/components/admin/useAdminDashboardTab'

type TabDef = {
  id: AdminDashboardTabId
  icon: string
  labelKey: string
  titleKey: string
  introKey: string
}

const TABS: TabDef[] = [
  {
    id: 'summary',
    icon: 'dashboard',
    labelKey: 'admin.dashboard.tabs.summary',
    titleKey: 'admin.dashboard.tabs.summaryTitle',
    introKey: 'admin.dashboard.tabs.summaryIntro',
  },
  {
    id: 'users',
    icon: 'group',
    labelKey: 'admin.dashboard.tabs.users',
    titleKey: 'admin.dashboard.tabs.usersTitle',
    introKey: 'admin.dashboard.tabs.usersIntro',
  },
]

type Props = {
  activeTab: AdminDashboardTabId
  onTabChange: (tab: AdminDashboardTabId) => void
  headerActions?: ReactNode
  children: ReactNode
}

export function AdminDashboardTabLayout({ activeTab, onTabChange, headerActions, children }: Props) {
  const { t } = useTranslation()
  const activeMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

  return (
    <div className="flex min-w-0 flex-col">
      {/* Horizontal tab strip — scroll on narrow viewports */}
      <nav
        role="tablist"
        aria-label={t('admin.dashboard.tabs.navAria')}
        className="scrollbar-site overflow-x-auto border-b border-surface-variant"
      >
        <div className="flex min-w-min">
          {TABS.map((tab) => {
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`admin-panel-${tab.id}`}
                id={`admin-tab-${tab.id}`}
                className={adminTabButton(active)}
                onClick={() => onTabChange(tab.id)}
              >
                <MaterialIcon
                  name={tab.icon}
                  size={18}
                  filled={active}
                  className={cn(active ? 'text-primary' : 'text-on-surface-variant')}
                />
                {t(tab.labelKey)}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Panel */}
      <div
        key={activeTab}
        className="mt-md min-w-0 animate-admin-tab-in"
        role="tabpanel"
        id={`admin-panel-${activeTab}`}
        aria-labelledby={`admin-tab-${activeTab}`}
      >
        <header className="mb-sm flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t(activeMeta.titleKey)}</h2>
            <p className={SETTINGS_TAB_PANEL_INTRO}>{t(activeMeta.introKey)}</p>
          </div>
          {headerActions ? (
            <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end sm:pt-0.5">
              {headerActions}
            </div>
          ) : null}
        </header>

        <div className={ADMIN_SECTION_GAP}>{children}</div>
      </div>
    </div>
  )
}
