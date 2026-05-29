import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { AdminMotivatorRolePanel } from '@/components/AdminMotivatorRolePanel'
import { AdminDashboardSummaryTab } from '@/components/admin/AdminDashboardSummaryTab'
import { AdminDashboardTabLayout } from '@/components/admin/AdminDashboardTabLayout'
import { useAdminDashboardTab } from '@/components/admin/useAdminDashboardTab'
import { useAdminMotivatorUsers } from '@/components/admin/useAdminMotivatorUsers'
import { useAdminOverview } from '@/components/admin/useAdminOverview'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { RequireVault } from '@/components/RequireVault'
import { cn } from '@/lib/cn'
import { SETTINGS_BTN_SECONDARY } from '@/lib/designClasses'
import { supabase } from '@/lib/supabase'

function AdminDashboardPageInner() {
  const { t, i18n } = useTranslation()
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

  const summaryHeaderActions =
    activeTab === 'summary' ? (
      <>
        {overviewState.lastLoaded ? (
          <span className="flex items-center justify-end gap-1.5 text-xs text-on-surface-variant/60">
            <MaterialIcon name="schedule" size={13} className="shrink-0" />
            {t('admin.dashboard.lastLoaded', {
              time: overviewState.lastLoaded.toLocaleTimeString(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
              }),
            })}
          </span>
        ) : null}
        <button
          type="button"
          className={cn(SETTINGS_BTN_SECONDARY, 'flex items-center justify-center gap-1.5')}
          disabled={overviewState.loadBusy}
          onClick={() => void overviewState.load()}
        >
          <MaterialIcon
            name="refresh"
            size={15}
            className={overviewState.loadBusy ? 'animate-spin' : undefined}
          />
          {overviewState.loadBusy ? t('common.loading') : t('admin.dashboard.refresh')}
        </button>
      </>
    ) : null

  return (
    <MotivatorShell activeNav="prototype-admin" wide align="left" title={t('admin.dashboard.title')}>
      <AdminDashboardTabLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        headerActions={summaryHeaderActions}
      >
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
