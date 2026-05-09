import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { ProductRoadmapModal } from '@/components/ProductRoadmapModal'
import { RequireVault } from '@/components/RequireVault'
import { APP_VERSION } from '@/version'
import { DEFAULT_GROUP_ID, PRIORITY_RANKS, type PriorityRank } from '@motivator/core'
import { useVault } from '@/vault/VaultProvider'

function GroupRow({
  initialName,
  isDefault,
  canEdit,
  onRename,
  onDelete,
}: {
  initialName: string
  isDefault: boolean
  canEdit: boolean
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)

  return (
    <div className="flex flex-wrap items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-500">
        <span>{t('settings.rename')}</span>
        <input
          className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white disabled:opacity-40"
          value={name}
          disabled={!canEdit}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const trimmed = name.trim()
            if (trimmed && trimmed !== initialName) onRename(trimmed)
          }}
        />
      </label>
      {!isDefault && (
        <button
          type="button"
          disabled={!canEdit}
          className="shrink-0 self-end rounded border border-red-900/50 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-40"
          onClick={() => onDelete()}
        >
          {t('common.delete')}
        </button>
      )}
    </div>
  )
}

function PriorityLabelField({
  rank,
  initialValue,
  canEdit,
  onCommit,
}: {
  rank: PriorityRank
  initialValue: string
  canEdit: boolean
  onCommit: (rank: PriorityRank, label: string) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(initialValue)

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">
        {t('settings.priorityLevelLabel', { rank })}
      </span>
      <input
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
        value={draft}
        disabled={!canEdit}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const trimmed = draft.trim()
          if (trimmed && trimmed !== initialValue) onCommit(rank, trimmed)
        }}
      />
    </label>
  )
}

const MIN_ACCOUNT_PASSWORD_LEN = 6

function SettingsPageInner() {
  const { t, i18n } = useTranslation()
  const { signOut, session, updatePassword } = useAuth()
  const {
    lock,
    vault,
    remoteHydrated,
    decryptFailed,
    addGroup,
    renameGroup,
    deleteGroup,
    setPriorityLabel,
  } = useVault()
  const [newGroupName, setNewGroupName] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [roadmapOpen, setRoadmapOpen] = useState(false)

  const canEdit = remoteHydrated && !decryptFailed
  const hasEmailLogin = Boolean(session?.user?.email)

  async function handleSignOut() {
    await lock()
    await signOut()
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)
    if (!hasEmailLogin) return
    if (pwNew !== pwConfirm) {
      setPwError(t('settings.passwordMismatch'))
      return
    }
    if (pwNew.length < MIN_ACCOUNT_PASSWORD_LEN) {
      setPwError(t('settings.passwordTooShort'))
      return
    }
    if (pwNew === pwCurrent) {
      setPwError(t('settings.passwordSameAsOld'))
      return
    }
    setPwBusy(true)
    const { error } = await updatePassword(pwCurrent, pwNew)
    setPwBusy(false)
    if (error) {
      setPwError(error.message)
      return
    }
    setPwSuccess(true)
    setPwCurrent('')
    setPwNew('')
    setPwConfirm('')
  }

  const sortedGroups = [...vault.groups].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link className="text-sm text-emerald-400 hover:text-emerald-300" to="/app">
          {t('settings.back')}
        </Link>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800"
          onClick={() => setRoadmapOpen(true)}
        >
          {t('settings.roadmapTempButton')}
        </button>
      </div>
      <h1 className="text-xl font-semibold text-white">{t('settings.title')}</h1>
      <p className="mt-2 text-sm text-zinc-400">{t('settings.seedHint')}</p>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-300">{t('settings.priorityLabelsTitle')}</h2>
        <p className="mt-2 text-xs text-zinc-500">{t('settings.priorityLabelsHelp')}</p>
        <div className="mt-4 flex flex-col gap-3">
          {PRIORITY_RANKS.map((rank) => (
            <PriorityLabelField
              key={`${rank}-${vault.priorityLabels[rank]}`}
              rank={rank}
              initialValue={vault.priorityLabels[rank]}
              canEdit={canEdit}
              onCommit={(r, label) => void setPriorityLabel(r, label)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-300">{t('common.language')}</h2>
        <select
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          value={i18n.language === 'en' ? 'en' : 'ru'}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
        >
          <option value="ru">{t('common.langRu')}</option>
          <option value="en">{t('common.langEn')}</option>
        </select>
      </section>

      <ProductRoadmapModal open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-300">{t('settings.accountPasswordTitle')}</h2>
        <p className="mt-2 text-xs text-zinc-500">{t('settings.accountPasswordHelp')}</p>
        <form className="mt-4 flex flex-col gap-3" onSubmit={(e) => void handlePasswordSubmit(e)}>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('settings.currentPassword')}</span>
            <input
              type="password"
              autoComplete="current-password"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
              value={pwCurrent}
              disabled={!canEdit || !hasEmailLogin || pwBusy}
              onChange={(e) => setPwCurrent(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('settings.newPasswordField')}</span>
            <input
              type="password"
              autoComplete="new-password"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
              value={pwNew}
              disabled={!canEdit || !hasEmailLogin || pwBusy}
              onChange={(e) => setPwNew(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('settings.confirmNewPassword')}</span>
            <input
              type="password"
              autoComplete="new-password"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
              value={pwConfirm}
              disabled={!canEdit || !hasEmailLogin || pwBusy}
              onChange={(e) => setPwConfirm(e.target.value)}
            />
          </label>
          {pwError ? (
            <p className="text-xs text-red-400" role="alert">
              {pwError}
            </p>
          ) : null}
          {pwSuccess ? (
            <p className="text-xs text-emerald-400/90" role="status">
              {t('settings.passwordChanged')}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!canEdit || !hasEmailLogin || pwBusy}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
          >
            {pwBusy ? t('common.loading') : t('settings.changePasswordSubmit')}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-300">{t('settings.groupsTitle')}</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canEdit) return
            void addGroup(newGroupName).then(() => setNewGroupName(''))
          }}
        >
          <input
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40"
            placeholder={t('settings.newGroupPlaceholder')}
            value={newGroupName}
            disabled={!canEdit}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button
            type="submit"
            disabled={!canEdit}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
          >
            {t('settings.addGroup')}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          {sortedGroups.map((g) => (
            <GroupRow
              key={`${g.id}-${g.name}`}
              initialName={g.name}
              isDefault={g.id === DEFAULT_GROUP_ID}
              canEdit={canEdit}
              onRename={(name) => void renameGroup(g.id, name)}
              onDelete={() => void deleteGroup(g.id)}
            />
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-zinc-600">
        {t('settings.appVersion', { version: APP_VERSION })}
      </p>

      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-100 hover:border-zinc-500"
        onClick={() => void handleSignOut()}
      >
        {t('settings.signOut')}
      </button>
    </div>
  )
}

export function SettingsPage() {
  return (
    <RequireVault>
      <SettingsPageInner />
    </RequireVault>
  )
}
