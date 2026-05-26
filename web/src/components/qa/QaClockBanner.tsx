import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAppNow } from '@/qa/QaClockProvider'

export function QaClockBanner() {
  const { t } = useTranslation()
  const { enabled, now, todayKey } = useAppNow()

  if (!enabled) return null

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-tertiary/50 bg-tertiary-container/20 px-3 py-2 text-label-sm text-on-surface"
      role="status"
    >
      <span>
        {t('admin.testingBanner', {
          datetime: now.toLocaleString(),
          dateKey: todayKey,
        })}
      </span>
      <Link
        to="/admin/testing"
        className="shrink-0 font-medium text-primary underline-offset-2 hover:underline"
      >
        {t('admin.testingBannerLink')}
      </Link>
    </div>
  )
}
