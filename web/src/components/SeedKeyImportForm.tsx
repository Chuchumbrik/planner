import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FIELD_LABEL, MOTIVATOR_INPUT } from '@/lib/designClasses'

type Props = {
  disabled?: boolean
  submitLabel?: string
  onSubmit: (seedB64: string, kdfPassword: string) => Promise<void>
}

export function SeedKeyImportForm({ disabled, submitLabel, onSubmit }: Props) {
  const { t } = useTranslation()
  const [importedSeed, setImportedSeed] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const seed = importedSeed.trim().replace(/\s+/g, '')
    if (!seed) {
      setError(t('onboarding.errNeedImport'))
      return
    }
    setPending(true)
    try {
      await onSubmit(seed, password)
    } catch {
      setError(t('onboarding.errSave'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <label className={`block text-sm ${FIELD_LABEL}`}>
        <span>{t('onboarding.importLabel')}</span>
        <textarea
          className={`${MOTIVATOR_INPUT} mt-1 min-h-[88px] resize-y font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
          value={importedSeed}
          disabled={disabled || pending}
          onChange={(e) => setImportedSeed(e.target.value)}
          placeholder={t('onboarding.importPlaceholder')}
          spellCheck={false}
          autoComplete="off"
        />
      </label>
      <label className={`block text-sm ${FIELD_LABEL}`}>
        <span>{t('onboarding.kdfPassword')}</span>
        <input
          className={`${MOTIVATOR_INPUT} mt-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
          type="password"
          value={password}
          disabled={disabled || pending}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={t('onboarding.kdfPlaceholder')}
        />
      </label>
      {error ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || pending}
        className="btn-primary w-full py-2.5 text-sm disabled:opacity-40"
      >
        {pending ? t('onboarding.saving') : (submitLabel ?? t('onboarding.continue'))}
      </button>
    </form>
  )
}
