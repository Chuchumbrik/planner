import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import {
  SETTINGS_TAB_PANEL_INTRO,
  SETTINGS_TAB_PANEL_TITLE,
  settingsTabButton,
} from '@/lib/designClasses'
import type { SettingsTabId } from '@/components/settings/useSettingsTab'

type TabDef = {
  id: SettingsTabId
  icon: string
  labelKey: string
  titleKey: string
  introKey: string
}

const TABS: TabDef[] = [
  {
    id: 'general',
    icon: 'tune',
    labelKey: 'settings.tabs.general',
    titleKey: 'settings.tabs.generalTitle',
    introKey: 'settings.tabs.generalIntro',
  },
  {
    id: 'privacy',
    icon: 'security',
    labelKey: 'settings.tabs.privacy',
    titleKey: 'settings.tabs.privacyTitle',
    introKey: 'settings.tabs.privacyIntro',
  },
  {
    id: 'planning',
    icon: 'event_note',
    labelKey: 'settings.tabs.planning',
    titleKey: 'settings.tabs.planningTitle',
    introKey: 'settings.tabs.planningIntro',
  },
  {
    id: 'notifications',
    icon: 'notifications',
    labelKey: 'settings.tabs.notifications',
    titleKey: 'settings.tabs.notificationsTitle',
    introKey: 'settings.tabs.notificationsIntro',
  },
  {
    id: 'admin',
    icon: 'admin_panel_settings',
    labelKey: 'settings.tabs.admin',
    titleKey: 'settings.tabs.adminTitle',
    introKey: 'settings.tabs.adminIntro',
  },
]

type Props = {
  activeTab: SettingsTabId
  onTabChange: (tab: SettingsTabId) => void
  showAdminTab: boolean
  children: ReactNode
}

export function SettingsTabLayout({ activeTab, onTabChange, showAdminTab, children }: Props) {
  const { t } = useTranslation()
  const visibleTabs = TABS.filter((tab) => tab.id !== 'admin' || showAdminTab)
  const activeMeta = visibleTabs.find((tab) => tab.id === activeTab) ?? visibleTabs[0]

  return (
    <div className="flex flex-col gap-lg lg:flex-row">
      <nav
        className="w-full shrink-0 lg:w-64"
        aria-label={t('settings.tabs.navAria')}
      >
        <div className="scrollbar-site flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {visibleTabs.map((tab) => {
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`settings-panel-${tab.id}`}
                id={`settings-tab-${tab.id}`}
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
        id={`settings-panel-${activeTab}`}
        aria-labelledby={`settings-tab-${activeTab}`}
      >
        {activeMeta ? (
          <header>
            <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t(activeMeta.titleKey)}</h2>
            <p className={SETTINGS_TAB_PANEL_INTRO}>{t(activeMeta.introKey)}</p>
          </header>
        ) : null}
        {children}
      </div>
    </div>
  )
}
