import { useTranslation } from 'react-i18next'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { ProductRoadmapPanel } from '@/components/ProductRoadmapPanel'
import { RequireVault } from '@/components/RequireVault'
import { SETTINGS_TAB_PANEL_INTRO, SETTINGS_TAB_PANEL_TITLE } from '@/lib/designClasses'

function AdminRoadmapPageInner() {
  const { t } = useTranslation()

  return (
    <MotivatorShell activeNav="prototype-admin" wide align="left" title={t('settings.roadmapTitle')}>
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-md">
          <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t('settings.roadmapTitle')}</h2>
          <p className={SETTINGS_TAB_PANEL_INTRO}>{t('admin.roadmapIntro')}</p>
        </header>
        <ProductRoadmapPanel />
      </div>
    </MotivatorShell>
  )
}

export function AdminRoadmapPage() {
  return (
    <RequireVault>
      <AdminRoadmapPageInner />
    </RequireVault>
  )
}
