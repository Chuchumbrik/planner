import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { AiRecurrenceRule, AiTaskProposal } from '@/types/aiAssistant'

function minutesToLabel(min: number, t: (k: string, o?: Record<string, unknown>) => string): string {
  if (min < 60) return t('aiAssistant.durationMin', { n: min })
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? t('aiAssistant.durationHMin', { h, m }) : t('aiAssistant.durationH', { h })
}

function timeFromMidnight(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const WEEKDAY_KEYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const WEEKDAY_KEYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function recurrenceLabel(
  rule: AiRecurrenceRule,
  lang: string,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const isRu = lang.startsWith('ru')
  if (rule.kind === 'daily') return t('aiAssistant.recurrenceDaily')
  if (rule.kind === 'everyNDays') return t('aiAssistant.recurrenceEveryNDays', { n: rule.n })
  if (rule.kind === 'weekly') {
    const names = isRu ? WEEKDAY_KEYS_RU : WEEKDAY_KEYS_EN
    const days = rule.weekdays.map((d) => names[d] ?? d).join(', ')
    return t('aiAssistant.recurrenceWeekly', { days })
  }
  return ''
}

export function AiTaskProposalCard({ task }: { task: AiTaskProposal }) {
  const { t, i18n } = useTranslation()

  const dateLabel = task.scheduledLocalDate
    ? new Date(task.scheduledLocalDate + 'T00:00:00').toLocaleDateString(i18n.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null

  const timeLabel =
    task.timeMode !== 'none' && task.timeMinutesFromMidnight != null
      ? timeFromMidnight(task.timeMinutesFromMidnight)
      : null

  const recLabel = task.recurrence ? recurrenceLabel(task.recurrence, i18n.language, t) : null

  return (
    <div className="flex items-start gap-2 rounded-card border border-surface-variant bg-surface-container p-3">
      <MaterialIcon name="check_box_outline_blank" size={18} className="mt-0.5 shrink-0 text-primary/60" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-body-sm font-medium text-on-surface">{task.title}</p>
          {task.groupName ? (
            <span className="shrink-0 rounded-sm bg-surface-variant px-1.5 py-0.5 text-xs text-on-surface-variant">
              {task.groupName}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-label-sm text-on-surface-variant">
          {dateLabel ? (
            <span className="flex items-center gap-0.5">
              <MaterialIcon name="calendar_today" size={12} />
              {dateLabel}
              {timeLabel ? ` · ${timeLabel}` : ''}
            </span>
          ) : null}
          {recLabel ? (
            <span className="flex items-center gap-0.5 text-primary/80">
              <MaterialIcon name="repeat" size={12} />
              {recLabel}
            </span>
          ) : null}
          {task.estimatedMinutes ? (
            <span className="flex items-center gap-0.5">
              <MaterialIcon name="schedule" size={12} />
              {minutesToLabel(task.estimatedMinutes, t)}
            </span>
          ) : null}
          {task.priorityRank && task.priorityRank >= 4 ? (
            <span className="flex items-center gap-0.5 text-amber-400">
              <MaterialIcon name="flag" size={12} />
              P{task.priorityRank}
            </span>
          ) : null}
        </div>
        {task.checklistItems?.length ? (
          <ul className="mt-1.5 space-y-0.5">
            {task.checklistItems.map((item, i) => (
              <li key={i} className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                <MaterialIcon name="chevron_right" size={12} className="shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
