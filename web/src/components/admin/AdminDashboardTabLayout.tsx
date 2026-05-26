import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  SETTINGS_TAB_PANEL_INTRO,
  SETTINGS_TAB_PANEL_TITLE,
  settingsTabButton,
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
  children: ReactNode
}

export function AdminDashboardTabLayout({ activeTab, onTabChange, children }: Props) {
  const { t } = useTranslation()
  const activeMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

  return (
    <div className="flex flex-col gap-lg lg:flex-row">
      <nav className="w-full shrink-0 lg:w-64" aria-label={t('admin.dashboard.tabs.navAria')}>
        <div className="scrollbar-site flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {TABS.map((tab) => {
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`admin-dashboard-panel-${tab.id}`}
                id={`admin-dashboard-tab-${tab.id}`}
                className={settingsTabButton(active)}
                onClick={() => onTabChange(tab.id)}
              >
                <MaterialIcon
                  name={tab.icon}
                  size={20}
                  filled={active}
                  className={cn(active ? 'text-primary' : 'text-on-surface-variant')}
                />
                <span className="text-label-md">{t(tab.labelKey)}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div
        className="min-w-0 flex-1 space-y-md"
        role="tabpanel"
        id={`admin-dashboard-panel-${activeTab}`}
        aria-labelledby={`admin-dashboard-tab-${activeTab}`}
      >
        <header>
          <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t(activeMeta.titleKey)}</h2>
          <p className={SETTINGS_TAB_PANEL_INTRO}>{t(activeMeta.introKey)}</p>
        </header>
        {children}
      </div>
    </div>
  )
}
