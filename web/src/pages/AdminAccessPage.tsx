import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AdminMotivatorRolePanel } from '@/components/AdminMotivatorRolePanel'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { RequireVault } from '@/components/RequireVault'
import { supabase } from '@/lib/supabase'
import { SETTINGS_TAB_PANEL_INTRO, SETTINGS_TAB_PANEL_TITLE } from '@/lib/designClasses'

function AdminAccessPageInner() {
  const { t } = useTranslation()
  const { session } = useAuth()

  if (!supabase) {
    return <Navigate to="/app" replace />
  }

  const userId = session?.user?.id
  if (!userId) {
    return <Navigate to="/login" replace />
  }

  return (
    <MotivatorShell activeNav="prototype-admin" wide title={t('admin.accessTitle')}>
      <header className="mb-md">
        <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t('admin.accessTitle')}</h2>
        <p className={SETTINGS_TAB_PANEL_INTRO}>{t('admin.accessIntro')}</p>
      </header>
      <AdminMotivatorRolePanel supabase={supabase} currentUserId={userId} />
    </MotivatorShell>
  )
}

export function AdminAccessPage() {
  return (
    <RequireVault>
      <AdminAccessPageInner />
    </RequireVault>
  )
}
