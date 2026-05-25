import { useCallback, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALERT_WARNING_BODY,
  ALERT_WARNING_MUTED,
  ALERT_WARNING_TITLE,
  CHECKBOX_INPUT,
  SETTINGS_BTN_SECONDARY,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import {
  getStoredSeedB64,
  hasAcknowledgedSeedWarning,
  setAcknowledgedSeedWarning,
} from '@/lib/seedStorage'

type Props = {
  className?: string
}

export function SeedExportPanel({ className = '' }: Props) {
  const { t } = useTranslation()
  const warnId = useId()
  const seed = getStoredSeedB64()
  const [ack, setAck] = useState(hasAcknowledgedSeedWarning)
  const [revealed, setRevealed] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)

  const canReveal = ack && Boolean(seed)

  const loadQr = useCallback(async (seedB64: string) => {
    setQrLoading(true)
    setQrError(false)
    setQrDataUrl(null)
    try {
      const QR = await import('qrcode')
      const url = await QR.toDataURL(seedB64, {
        margin: 1,
        width: 200,
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(url)
    } catch {
      setQrError(true)
    } finally {
      setQrLoading(false)
    }
  }, [])

  const handleCopy = useCallback(async () => {
    if (!seed) return
    try {
      await navigator.clipboard.writeText(seed)
      setCopyDone(true)
      window.setTimeout(() => setCopyDone(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }, [seed])

  const handleDownload = useCallback(() => {
    if (!seed) return
    const blob = new Blob([`${seed}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'motivator-seed.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [seed])

  const toggleReveal = useCallback(() => {
    if (!canReveal || !seed) return
    if (revealed) {
      setRevealed(false)
      setQrDataUrl(null)
      setQrError(false)
      return
    }
    setRevealed(true)
    void loadQr(seed)
  }, [canReveal, revealed, seed, loadQr])

  if (!seed) {
    return <p className={`text-sm text-on-surface-variant ${className}`}>{t('settings.seedMissing')}</p>
  }

  return (
    <div className={className}>
      <div className={ALERT_WARNING_MUTED} id={warnId}>
        <p className={ALERT_WARNING_TITLE}>{t('settings.seedWarningTitle')}</p>
        <p className={cn('mt-2', ALERT_WARNING_BODY)}>{t('settings.seedWarningBody')}</p>
        <ul className={cn('mt-2 list-inside list-disc space-y-1', ALERT_WARNING_BODY)}>
          <li>{t('settings.seedWarningBullet1')}</li>
          <li>{t('settings.seedWarningBullet2')}</li>
          <li>{t('settings.seedWarningBullet3')}</li>
        </ul>
      </div>

      {!ack ? (
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-on-surface">
          <input
            type="checkbox"
            className={`mt-0.5 ${CHECKBOX_INPUT}`}
            checked={ack}
            onChange={(e) => {
              const next = e.target.checked
              setAck(next)
              if (next) setAcknowledgedSeedWarning()
            }}
          />
          <span>{t('settings.seedWarningAck')}</span>
        </label>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canReveal}
          className={SETTINGS_BTN_SECONDARY}
          onClick={toggleReveal}
        >
          {revealed ? t('settings.seedHide') : t('settings.seedReveal')}
        </button>
        <button
          type="button"
          disabled={!canReveal}
          className={SETTINGS_BTN_SECONDARY}
          onClick={() => void handleCopy()}
        >
          {copyDone ? t('settings.seedCopied') : t('settings.seedCopy')}
        </button>
        <button
          type="button"
          disabled={!canReveal}
          className={SETTINGS_BTN_SECONDARY}
          onClick={handleDownload}
        >
          {t('settings.seedDownload')}
        </button>
      </div>

      {revealed && canReveal ? (
        <div className="mt-4 space-y-4">
          <div className="motivator-card bg-black/40 p-3">
            <p className="font-display text-xs uppercase tracking-wide text-on-surface-variant">
              {t('settings.seedLabel')}
            </p>
            <p className="mt-2 break-all font-mono text-xs text-primary">{seed}</p>
          </div>
          {qrDataUrl ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs text-on-surface-variant">{t('settings.seedQrHint')}</p>
              <img
                src={qrDataUrl}
                alt={t('settings.seedQrAlt')}
                className="rounded-lg border border-surface-variant bg-white p-2"
                width={200}
                height={200}
              />
            </div>
          ) : qrError ? (
            <p className="text-xs text-on-surface-variant">{t('settings.seedQrUnavailable')}</p>
          ) : qrLoading ? (
            <p className="text-xs text-on-surface-variant">{t('common.loading')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
