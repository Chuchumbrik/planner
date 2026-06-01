import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { MVP_PHASES_PLANNED, RELEASE_NOTES_BLOCKS } from '@/data/productRoadmap'
import { relativeDayLabel } from '@/lib/relativeTime'
import { groupReleasesByDay } from '@/lib/roadmapTimeline'
import {
  decideReminder,
  REMINDER_THRESHOLD_OPTIONS,
  todayIso,
  type ReminderConfig,
} from '@/lib/releaseCadence'

const LS_HOURS = 'adminRoadmapReminderHours'
const LS_SNOOZE = 'adminRoadmapReminderSnoozedUntil'
const DEFAULT_HOURS = 24

function readLS(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLS(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* ignore quota/private-mode */
  }
}

/** Янтарный/красный баннер «давно не было релиза» под Hero (Phase 7.7). */
export function ReleaseCadenceReminder({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const lang: 'ru' | 'en' = i18n.language === 'en' ? 'en' : 'ru'
  const now = useMemo(() => new Date(), [])

  const lastReleaseISO = useMemo(() => {
    const groups = groupReleasesByDay(RELEASE_NOTES_BLOCKS)
    return groups[0]?.dateISO ?? todayIso(now)
  }, [now])

  const paused = useMemo(() => MVP_PHASES_PLANNED.find((p) => p.current)?.paused === true, [])

  const [thresholdHours, setThresholdHours] = useState(() => {
    const raw = Number(readLS(LS_HOURS))
    return REMINDER_THRESHOLD_OPTIONS.includes(raw as (typeof REMINDER_THRESHOLD_OPTIONS)[number])
      ? raw
      : DEFAULT_HOURS
  })
  const [snoozedUntil, setSnoozedUntil] = useState<string | null>(() => readLS(LS_SNOOZE))

  const cfg: ReminderConfig = { thresholdHours, respectWeekends: true, snoozedUntil, paused }
  const result = decideReminder(lastReleaseISO, now, cfg)

  const onSnooze = () => {
    const until = todayIso(now)
    writeLS(LS_SNOOZE, until)
    setSnoozedUntil(until)
  }
  const onChangeThreshold = (h: number) => {
    writeLS(LS_HOURS, String(h))
    setThresholdHours(h)
  }

  if (result.reason === 'paused') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-surface-variant/70 bg-surface-container-low/40 px-3 py-2 text-xs text-on-surface-variant',
          className,
        )}
      >
        <MaterialIcon name="pause_circle" size={16} />
        {t('settings.roadmapReminderPaused')}
      </div>
    )
  }

  if (result.severity === 'none') return null

  const red = result.severity === 'red'
  const tone = red
    ? 'border-red-500/40 bg-red-500/10 text-red-200'
    : 'border-amber-500/40 bg-amber-500/10 text-amber-100'

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5', tone, className)}>
      <MaterialIcon name={red ? 'warning' : 'schedule'} size={18} className="shrink-0" filled={red} />
      <span className="min-w-0 flex-1 text-sm">
        {red
          ? t('settings.roadmapReminderRed', { days: result.daysSince })
          : t('settings.roadmapReminderAmber', { rel: relativeDayLabel(lastReleaseISO, now, lang) })}
      </span>
      <label className="flex items-center gap-1 text-[11px] opacity-90">
        {t('settings.roadmapReminderThreshold')}
        <select
          value={thresholdHours}
          onChange={(e) => onChangeThreshold(Number(e.target.value))}
          aria-label={t('settings.roadmapReminderThreshold')}
          className="rounded border border-current/30 bg-transparent px-1 py-0.5 text-current"
        >
          {REMINDER_THRESHOLD_OPTIONS.map((h) => (
            <option key={h} value={h} className="text-on-surface">
              {h} {t('settings.roadmapReminderHoursShort')}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={onSnooze}
        className="rounded-md border border-current/30 px-2 py-1 text-[11px] font-medium hover:bg-current/10"
      >
        {t('settings.roadmapReminderSnooze')}
      </button>
    </div>
  )
}
