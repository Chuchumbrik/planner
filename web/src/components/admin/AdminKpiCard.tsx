import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { InfoTooltip } from '@/components/admin/InfoTooltip'
import { cn } from '@/lib/cn'
import { SETTINGS_CARD } from '@/lib/designClasses'
import type { AdminKpiMetric } from '@/types/adminMonitoring'

type Props = {
  icon: string
  labelKey: string
  value: string
  tooltip?: string
  trendMetric?: AdminKpiMetric
  danger?: boolean
  isActive?: boolean
  loading?: boolean
  staleDays?: number
  onActivate?: () => void
  className?: string
}

export function AdminKpiCard({
  icon,
  labelKey,
  value,
  tooltip,
  trendMetric,
  danger = false,
  isActive = false,
  loading = false,
  staleDays,
  onActivate,
  className,
}: Props) {
  const { t } = useTranslation()

  const label =
    labelKey === 'admin.dashboard.kpiVaultStale' && staleDays != null
      ? t(labelKey, { days: staleDays })
      : t(labelKey)

  return (
    <article
      className={cn(
        SETTINGS_CARD,
        'relative flex h-full flex-col justify-between gap-sm transition-colors',
        trendMetric && 'cursor-pointer hover:bg-surface-container-high',
        isActive && 'bg-surface-container-high ring-2 ring-primary',
        className,
      )}
      onClick={trendMetric ? onActivate : undefined}
      role={trendMetric ? 'button' : undefined}
      aria-pressed={trendMetric ? isActive : undefined}
      tabIndex={trendMetric ? 0 : undefined}
      onKeyDown={
        trendMetric
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onActivate?.()
              }
            }
          : undefined
      }
    >
      {/* colour accent bar */}
      <div
        className={cn('absolute inset-x-0 top-0 h-0.5', danger ? 'bg-red-400/60' : 'bg-primary/60')}
      />

      {/* label + tooltip + icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
            {label}
          </p>
          {tooltip ? <InfoTooltip text={tooltip} /> : null}
        </div>
        <MaterialIcon
          name={icon}
          size={16}
          className={cn('shrink-0', danger ? 'text-red-400/30' : 'text-primary/30')}
        />
      </div>

      {/* value / skeleton — flex-1 centers in tall bento cells */}
      <div className="flex min-h-[2.5rem] flex-1 flex-col justify-center">
        {loading ? (
          <div className="h-10 w-24 animate-pulse rounded-md bg-surface-container-highest" />
        ) : (
          <p
            className={cn(
              'font-display text-4xl font-bold leading-none tabular-nums',
              danger ? 'text-red-400' : 'text-on-surface',
            )}
          >
            {value}
          </p>
        )}
      </div>

      {/* trend indicator */}
      {trendMetric ? (
        <div
          className={cn(
            'flex items-center gap-1 text-xs transition-colors',
            isActive ? 'text-primary' : 'text-on-surface-variant/40',
          )}
        >
          <MaterialIcon name={isActive ? 'expand_less' : 'trending_up'} size={13} />
          <span>{t(isActive ? 'admin.dashboard.kpiTrend.hide' : 'admin.dashboard.kpiTrend.show')}</span>
        </div>
      ) : null}
    </article>
  )
}
