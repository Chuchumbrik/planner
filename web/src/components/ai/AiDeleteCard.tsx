import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

type Props = {
  title: string
  found: boolean
}

export function AiDeleteCard({ title, found }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 rounded-card border border-error/30 bg-error/5 px-3 py-2">
      <MaterialIcon name="delete" size={16} className="shrink-0 text-error/70" />
      <span className="flex-1 text-body-sm text-on-surface">{title}</span>
      {!found ? (
        <span className="text-label-sm text-error/70">{t('aiAssistant.editTaskNotFound')}</span>
      ) : null}
    </div>
  )
}
