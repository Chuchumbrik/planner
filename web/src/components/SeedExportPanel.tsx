import { useCallback, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
    return <p className={`text-sm text-zinc-400 ${className}`}>{t('settings.seedMissing')}</p>
  }

  return (
    <div className={className}>
      <div
        className="rounded-lg border border-amber-900/50 bg-amber-950/25 px-3 py-3 text-xs leading-relaxed text-amber-100/90"
        id={warnId}
      >
        <p className="font-medium text-amber-100">{t('settings.seedWarningTitle')}</p>
        <p className="mt-2">{t('settings.seedWarningBody')}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-200/80">
          <li>{t('settings.seedWarningBullet1')}</li>
          <li>{t('settings.seedWarningBullet2')}</li>
          <li>{t('settings.seedWarningBullet3')}</li>
        </ul>
      </div>

      {!ack ? (
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="mt-0.5"
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
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
          onClick={toggleReveal}
        >
          {revealed ? t('settings.seedHide') : t('settings.seedReveal')}
        </button>
        <button
          type="button"
          disabled={!canReveal}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
          onClick={() => void handleCopy()}
        >
          {copyDone ? t('settings.seedCopied') : t('settings.seedCopy')}
        </button>
        <button
          type="button"
          disabled={!canReveal}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
          onClick={handleDownload}
        >
          {t('settings.seedDownload')}
        </button>
      </div>

      {revealed && canReveal ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-zinc-700 bg-black/40 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{t('settings.seedLabel')}</p>
            <p className="mt-2 break-all font-mono text-xs text-emerald-300">{seed}</p>
          </div>
          {qrDataUrl ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs text-zinc-500">{t('settings.seedQrHint')}</p>
              <img
                src={qrDataUrl}
                alt={t('settings.seedQrAlt')}
                className="rounded border border-zinc-700 bg-white p-2"
                width={200}
                height={200}
              />
            </div>
          ) : qrError ? (
            <p className="text-xs text-zinc-500">{t('settings.seedQrUnavailable')}</p>
          ) : qrLoading ? (
            <p className="text-xs text-zinc-500">{t('common.loading')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
