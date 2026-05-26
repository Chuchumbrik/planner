import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { MotivatorRoleRow } from '@/components/AdminMotivatorRolePanel'
import { computeAdminAuthKpis } from '@/components/admin/adminDashboardMetrics'

type KpiCard = {
  icon: string
  labelKey: string
  value: string
}

export function AdminDashboardSummaryTab({
  users,
  loadBusy,
}: {
  users: MotivatorRoleRow[]
  loadBusy: boolean
}) {
  const { t } = useTranslation()
  const kpis = useMemo(() => computeAdminAuthKpis(users), [users])

  const cards: KpiCard[] = [
    { icon: 'group', labelKey: 'admin.dashboard.kpiTotal', value: loadBusy ? '…' : String(kpis.total) },
    {
      icon: 'person_add',
      labelKey: 'admin.dashboard.kpiRegistered7d',
      value: loadBusy ? '…' : String(kpis.registeredLast7d),
    },
    {
      icon: 'login',
      labelKey: 'admin.dashboard.kpiSignedIn7d',
      value: loadBusy ? '…' : String(kpis.signedInLast7d),
    },
    {
      icon: 'badge',
      labelKey: 'admin.dashboard.kpiRoles',
      value: loadBusy
        ? '…'
        : t('admin.dashboard.kpiRolesValue', {
            admin: kpis.roleAdmin,
            beta: kpis.roleBeta,
            user: kpis.roleUser,
          }),
    },
  ]

  return (
    <div className="space-y-md">
      <p className="text-body-sm text-on-surface-variant">{t('admin.dashboard.authMetricsHint')}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <article key={c.labelKey} className="motivator-card flex items-center gap-4 p-5">
            <MaterialIcon name={c.icon} className="text-primary" size={28} />
            <div className="min-w-0">
              <p className="text-xs text-on-surface-variant">{t(c.labelKey)}</p>
              <p className="font-display text-2xl font-bold text-on-surface">{c.value}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
