import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { AdminMotivatorRolePanel } from '@/components/AdminMotivatorRolePanel'
import { AdminDashboardSummaryTab } from '@/components/admin/AdminDashboardSummaryTab'
import { AdminDashboardTabLayout } from '@/components/admin/AdminDashboardTabLayout'
import { useAdminDashboardTab } from '@/components/admin/useAdminDashboardTab'
import { useAdminMotivatorUsers } from '@/components/admin/useAdminMotivatorUsers'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { RequireVault } from '@/components/RequireVault'
import { supabase } from '@/lib/supabase'

function AdminDashboardPageInner() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useAdminDashboardTab()
  const { users, loadBusy, loadError, load, setLoadError } = useAdminMotivatorUsers(supabase)

  if (!supabase) {
    return <Navigate to="/app" replace />
  }

  const userId = session?.user?.id
  if (!userId) {
    return <Navigate to="/login" replace />
  }

  return (
    <MotivatorShell activeNav="prototype-admin" wide title={t('admin.dashboard.title')}>
      <AdminDashboardTabLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'summary' ? (
          <AdminDashboardSummaryTab users={users} loadBusy={loadBusy} />
        ) : (
          <AdminMotivatorRolePanel
            supabase={supabase}
            currentUserId={userId}
            users={users}
            loadBusy={loadBusy}
            loadError={loadError}
            onRefresh={() => void load()}
            onReload={load}
            onLoadError={setLoadError}
          />
        )}
      </AdminDashboardTabLayout>
    </MotivatorShell>
  )
}

export function AdminDashboardPage() {
  return (
    <RequireVault>
      <AdminDashboardPageInner />
    </RequireVault>
  )
}
