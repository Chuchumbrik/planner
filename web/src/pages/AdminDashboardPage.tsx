import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { AdminMotivatorRolePanel } from '@/components/AdminMotivatorRolePanel'
import { AdminDashboardSummaryTab } from '@/components/admin/AdminDashboardSummaryTab'
import { AdminDashboardTabLayout } from '@/components/admin/AdminDashboardTabLayout'
import { useAdminDashboardTab } from '@/components/admin/useAdminDashboardTab'
import { useAdminMotivatorUsers } from '@/components/admin/useAdminMotivatorUsers'
import { useAdminOverview } from '@/components/admin/useAdminOverview'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { RequireVault } from '@/components/RequireVault'
import { supabase } from '@/lib/supabase'

function AdminDashboardPageInner() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useAdminDashboardTab()
  const overviewState = useAdminOverview(supabase)
  const usersState = useAdminMotivatorUsers(supabase, { enabled: activeTab === 'users' })

  if (!supabase) {
    return <Navigate to="/app" replace />
  }

  const userId = session?.user?.id
  if (!userId) {
    return <Navigate to="/login" replace />
  }

  async function reloadUsersAndOverview() {
    await Promise.all([usersState.load(), overviewState.load()])
  }

  return (
    <MotivatorShell activeNav="prototype-admin" wide title={t('admin.dashboard.title')}>
      <AdminDashboardTabLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'summary' ? (
          <AdminDashboardSummaryTab
            overview={overviewState.overview}
            loadBusy={overviewState.loadBusy}
            loadError={overviewState.loadError}
            listDegraded={overviewState.listDegraded}
            supabase={supabase}
          />
        ) : (
          <AdminMotivatorRolePanel
            supabase={supabase}
            currentUserId={userId}
            users={usersState.users}
            loadBusy={usersState.loadBusy}
            loadError={usersState.loadError}
            listDegraded={usersState.listDegraded}
            onRefresh={() => void usersState.load()}
            onReload={reloadUsersAndOverview}
            onLoadError={usersState.setLoadError}
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
