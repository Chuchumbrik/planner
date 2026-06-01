import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import type { DiscussionStatus } from '@/lib/discussionsApi'
import { DISCUSSION_STATUS_META } from './discussionStatusMeta'

/** Discussion status chip (open/pending-journal/synced/archived) — colours/icons per §8.4. */
export function DiscussionStatusChip({
  status,
  className,
}: {
  status: DiscussionStatus
  className?: string
}) {
  const { t } = useTranslation()
  const meta = DISCUSSION_STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        meta.chipClass,
        className,
      )}
    >
      <MaterialIcon name={meta.icon} size={12} />
      {t(meta.labelKey)}
    </span>
  )
}
