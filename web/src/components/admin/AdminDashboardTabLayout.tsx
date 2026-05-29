import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { SETTINGS_TAB_PANEL_INTRO, SETTINGS_TAB_PANEL_TITLE } from '@/lib/designClasses'
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
    <div className="flex flex-col">
      {/* Horizontal tab strip */}
      <nav
        role="tablist"
        aria-label={t('admin.dashboard.tabs.navAria')}
        className="flex border-b border-surface-variant"
      >
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
              className={cn(
                'flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-label-md transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface',
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <MaterialIcon
                name={tab.icon}
                size={18}
                filled={active}
                className={active ? 'text-primary' : 'text-on-surface-variant'}
              />
              {t(tab.labelKey)}
            </button>
          )
        })}
      </nav>

      {/* Panel */}
      <div
        key={activeTab}
        className="mt-lg animate-admin-tab-in"
        role="tabpanel"
        id={`admin-panel-${activeTab}`}
        aria-labelledby={`admin-tab-${activeTab}`}
      >
        <header className="mb-md">
          <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t(activeMeta.titleKey)}</h2>
          <p className={SETTINGS_TAB_PANEL_INTRO}>{t(activeMeta.introKey)}</p>
        </header>
        {children}
      </div>
    </div>
  )
}
