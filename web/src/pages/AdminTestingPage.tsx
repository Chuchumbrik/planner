import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { RequireVault } from '@/components/RequireVault'
import { useAppNow } from '@/qa/QaClockProvider'
import {
  appLocalDateKey,
  getAppNow,
  getQaClockConfig,
  qaClockFormParts,
  qaClockMsFromParts,
  setQaClockConfig,
} from '@/lib/appNow'
import {
  ALERT_WARNING,
  ALERT_WARNING_BODY,
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
  SETTINGS_CARD,
  SETTINGS_LABEL,
  SETTINGS_TAB_PANEL_INTRO,
  SETTINGS_TAB_PANEL_TITLE,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

function AdminTestingPageInner() {
  const { t } = useTranslation()
  const { enabled: activeOverride } = useAppNow()

  const initialMs = useMemo(() => {
    const c = getQaClockConfig()
    if (c?.enabled) return c.fakeNowMs
    return getAppNow().getTime()
  }, [])

  const initialParts = useMemo(() => qaClockFormParts(initialMs), [initialMs])

  const [overrideEnabled, setOverrideEnabled] = useState(() => Boolean(getQaClockConfig()?.enabled))
  const [dateKey, setDateKey] = useState(initialParts.dateKey)
  const [time, setTime] = useState(initialParts.time)

  const previewMs = qaClockMsFromParts(dateKey, time)
  const previewValid = previewMs != null

  function applyConfig(nextEnabled: boolean) {
    if (!nextEnabled) {
      setQaClockConfig(null)
      return
    }
    if (previewMs == null) return
    setQaClockConfig({ enabled: true, fakeNowMs: previewMs })
  }

  function handleApply() {
    applyConfig(overrideEnabled)
  }

  function handleUseRealNow() {
    const ms = Date.now()
    const parts = qaClockFormParts(ms)
    setDateKey(parts.dateKey)
    setTime(parts.time)
    if (overrideEnabled) {
      setQaClockConfig({ enabled: true, fakeNowMs: ms })
    }
  }

  function handleDisable() {
    setOverrideEnabled(false)
    setQaClockConfig(null)
  }

  const effectiveNow = activeOverride ? getAppNow() : null

  return (
    <MotivatorShell activeNav="prototype-admin" wide title={t('admin.testingTitle')}>
      <header className="mb-md">
        <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t('admin.testingTitle')}</h2>
        <p className={SETTINGS_TAB_PANEL_INTRO}>{t('admin.testingIntro')}</p>
      </header>

      <div className={cn(SETTINGS_CARD, 'max-w-xl space-y-5')}>
        <div className={cn(ALERT_WARNING, 'text-sm')}>
          <p className={ALERT_WARNING_BODY}>{t('admin.testingWarning')}</p>
        </div>

        {activeOverride && effectiveNow ? (
          <p className="text-label-md text-primary" role="status">
            {t('admin.testingActiveStatus', {
              datetime: effectiveNow.toLocaleString(),
              dateKey: appLocalDateKey(effectiveNow),
            })}
          </p>
        ) : (
          <p className="text-label-sm text-on-surface-variant">{t('admin.testingInactiveStatus')}</p>
        )}

        <label className={`flex cursor-pointer items-center gap-3 ${SETTINGS_LABEL}`}>
          <input
            type="checkbox"
            className="motivator-checkbox size-5 shrink-0"
            checked={overrideEnabled}
            onChange={(e) => setOverrideEnabled(e.target.checked)}
          />
          <span>{t('admin.testingOverrideEnable')}</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`flex flex-col gap-1.5 ${SETTINGS_LABEL}`}>
            <span>{t('admin.testingDateLabel')}</span>
            <input
              type="date"
              className={MOTIVATOR_INPUT}
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
            />
          </label>
          <label className={`flex flex-col gap-1.5 ${SETTINGS_LABEL}`}>
            <span>{t('admin.testingTimeLabel')}</span>
            <input
              type="time"
              className={MOTIVATOR_INPUT}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>

        {!previewValid ? (
          <p className="text-label-sm text-error">{t('admin.testingInvalidDatetime')}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            disabled={!overrideEnabled || !previewValid}
            onClick={handleApply}
          >
            {t('admin.testingApply')}
          </button>
          <button type="button" className={SETTINGS_BTN_SECONDARY} onClick={handleUseRealNow}>
            {t('admin.testingSyncRealNow')}
          </button>
          <button
            type="button"
            className={SETTINGS_BTN_SECONDARY}
            disabled={!activeOverride && !overrideEnabled}
            onClick={handleDisable}
          >
            {t('admin.testingDisable')}
          </button>
        </div>

        <p className="text-label-sm leading-relaxed text-on-surface-variant">
          {t('admin.testingScopeHint')}
        </p>
      </div>
    </MotivatorShell>
  )
}

export function AdminTestingPage() {
  return (
    <RequireVault>
      <AdminTestingPageInner />
    </RequireVault>
  )
}
