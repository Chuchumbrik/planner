import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

export function PrototypeBanner() {
  const { t } = useTranslation()

  return (
    <div
      className="mb-6 flex flex-wrap items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3"
      role="note"
    >
      <MaterialIcon name="science" className="shrink-0 text-primary" size={22} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-on-surface">
          {t('prototype.bannerTitle')}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">{t('prototype.bannerBody')}</p>
        <Link
          to="/app"
          className="mt-2 inline-block text-body-sm text-primary hover:brightness-110"
        >
          {t('prototype.backToPlanner')}
        </Link>
      </div>
    </div>
  )
}
