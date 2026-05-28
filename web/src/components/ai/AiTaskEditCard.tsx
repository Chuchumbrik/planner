import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { AiTaskEdit } from '@/types/aiAssistant'

export function AiTaskEditCard({ edit, found }: { edit: AiTaskEdit; found: boolean }) {
  const { t, i18n } = useTranslation()

  const { changes } = edit

  const dateLabel = changes.scheduledLocalDate
    ? new Date(changes.scheduledLocalDate + 'T00:00:00').toLocaleDateString(i18n.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : changes.scheduledLocalDate === null
      ? t('aiAssistant.editNoDate')
      : null

  return (
    <div className={`flex items-start gap-2 rounded-card border p-3 ${found ? 'border-surface-variant bg-surface-container' : 'border-error/30 bg-error/5'}`}>
      <MaterialIcon
        name={found ? 'edit' : 'error_outline'}
        size={16}
        className={`mt-0.5 shrink-0 ${found ? 'text-primary/60' : 'text-error/60'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-medium text-on-surface">{edit.taskTitle}</p>
        {!found ? (
          <p className="mt-0.5 text-label-sm text-error">{t('aiAssistant.editTaskNotFound')}</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-label-sm text-on-surface-variant">
            {changes.title ? (
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="drive_file_rename_outline" size={12} />
                {changes.title}
              </span>
            ) : null}
            {dateLabel !== null ? (
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="calendar_today" size={12} />
                {dateLabel}
              </span>
            ) : null}
            {changes.priorityRank != null ? (
              <span className="flex items-center gap-0.5 text-amber-400">
                <MaterialIcon name="flag" size={12} />
                P{changes.priorityRank}
              </span>
            ) : null}
            {changes.groupName ? (
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="folder" size={12} />
                {changes.groupName}
              </span>
            ) : null}
            {'estimatedMinutes' in changes ? (
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="schedule" size={12} />
                {changes.estimatedMinutes != null
                  ? t('aiAssistant.durationMin', { n: changes.estimatedMinutes })
                  : t('aiAssistant.editNoEstimate')}
              </span>
            ) : null}
            {changes.done === true ? (
              <span className="flex items-center gap-0.5 text-emerald-500">
                <MaterialIcon name="check_circle" size={12} />
                {t('aiAssistant.editMarkDone')}
              </span>
            ) : null}
            {changes.done === false ? (
              <span className="flex items-center gap-0.5 text-on-surface-variant">
                <MaterialIcon name="radio_button_unchecked" size={12} />
                {t('aiAssistant.editMarkUndone')}
              </span>
            ) : null}
            {changes.checklistItems != null ? (
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="checklist" size={12} />
                {t('aiAssistant.editChecklist', { count: changes.checklistItems.length })}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
