import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
      <label className="block text-sm">
        <span className="text-zinc-400">{t('onboarding.importLabel')}</span>
        <textarea
          className="mt-1 min-h-[88px] w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500/80 disabled:opacity-40"
          value={importedSeed}
          disabled={disabled || pending}
          onChange={(e) => setImportedSeed(e.target.value)}
          placeholder={t('onboarding.importPlaceholder')}
          spellCheck={false}
          autoComplete="off"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-400">{t('onboarding.kdfPassword')}</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/80 disabled:opacity-40"
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
        className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
      >
        {pending ? t('onboarding.saving') : (submitLabel ?? t('onboarding.continue'))}
      </button>
    </form>
  )
}
