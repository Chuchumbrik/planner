import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { SecurityLogPanel } from '@/components/settings/SecurityLogPanel'
import { SettingsTabLayout } from '@/components/settings/SettingsTabLayout'
import { useSettingsTab } from '@/components/settings/useSettingsTab'
import { RequireVault } from '@/components/RequireVault'
import { SeedExportPanel } from '@/components/SeedExportPanel'
import { SettingsLegalSection } from '@/components/SettingsLegalSection'
import { VaultDecryptHelp } from '@/components/VaultDecryptHelp'
import { APP_VERSION } from '@/version'
import { DEFAULT_GROUP_ID, PRIORITY_RANKS, type PriorityRank, type NotificationDeliveryMode } from '@motivator/core'
import { getVapidPublicKey } from '@/lib/notifications/pushSubscription'
import {
  MOTIVATOR_INPUT,
  SETTINGS_BTN_SECONDARY,
  SETTINGS_CARD,
  SETTINGS_CHECKBOX_ROW,
  SETTINGS_LABEL,
  SETTINGS_SUBHEAD,
  TEXT_HINT_WARNING,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import { useVault } from '@/vault/VaultProvider'

function formatMinutesAsTimeValue(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function minutesFromTimeInputValue(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isInteger(h) || h < 0 || h > 23) return null
  if (!Number.isInteger(min) || min < 0 || min > 59) return null
  return h * 60 + min
}

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
    <div className="flex flex-wrap items-start gap-2 rounded-card border border-surface-variant bg-surface-container-low px-3 py-2">
      <label className={`flex min-w-0 flex-1 flex-col gap-1 ${SETTINGS_LABEL}`}>
        <span>{t('settings.rename')}</span>
        <input
          className={MOTIVATOR_INPUT}
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
      <span className={SETTINGS_LABEL}>
        {t('settings.priorityLevelLabel', { rank })}
      </span>
      <input
        className={MOTIVATOR_INPUT}
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
/** Дефолт времени EOD push-напоминания (20:30 локально). */
const EOD_DEFAULT_PUSH_REMINDER_MINUTES = 20 * 60 + 30

function SettingsPageInner() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { session, updatePassword, isAdmin, canAccessPreviewFeatures } = useAuth()
  const {
    vault,
    remoteHydrated,
    decryptFailed,
    savePending,
    addGroup,
    renameGroup,
    deleteGroup,
    setPriorityLabel,
    setEodEnabled,
    setEodAutoCloseAtDayEnd,
    setEodPushReminderMinutes,
    setNotificationDeliveryMode,
    subscribePushNotifications,
    sendTestPushNotification,
  } = useVault()
  const [newGroupName, setNewGroupName] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [notifPushHint, setNotifPushHint] = useState<string | null>(null)
  const [testPushBusy, setTestPushBusy] = useState(false)
  const [testPushError, setTestPushError] = useState<string | null>(null)
  const [notifModeDraft, setNotifModeDraft] = useState<NotificationDeliveryMode>('off')
  const [notifModeSaving, setNotifModeSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const savePendingWasRef = useRef(false)

  const deliveryMode: NotificationDeliveryMode =
    vault.notificationPreferences?.deliveryMode ?? 'off'

  useEffect(() => {
    setNotifModeDraft(deliveryMode)
  }, [deliveryMode])

  useEffect(() => {
    if (savePendingWasRef.current && !savePending && remoteHydrated && !decryptFailed) {
      setSavedFlash(true)
      const id = window.setTimeout(() => setSavedFlash(false), 2500)
      savePendingWasRef.current = false
      return () => window.clearTimeout(id)
    }
    savePendingWasRef.current = savePending
  }, [savePending, remoteHydrated, decryptFailed])
  const eodPushReminder = vault.eodPreferences?.pushReminderMinutesFromMidnight
  const eodPushReminderOn = typeof eodPushReminder === 'number'
  const eodPushTimeValue = eodPushReminderOn
    ? formatMinutesAsTimeValue(eodPushReminder)
    : formatMinutesAsTimeValue(EOD_DEFAULT_PUSH_REMINDER_MINUTES)

  const hasEmailLogin = Boolean(session?.user?.email)
  const canEdit = remoteHydrated && !decryptFailed
  const notifModeDirty = notifModeDraft !== deliveryMode
  const [activeTab, setActiveTab] = useSettingsTab()

  useEffect(() => {
    if (window.location.hash.replace(/^#/, '') !== 'admin') return
    if (isAdmin) {
      navigate('/admin/dashboard?tab=users', { replace: true })
    } else if (canAccessPreviewFeatures) {
      navigate('/admin/roadmap', { replace: true })
    }
  }, [navigate, isAdmin, canAccessPreviewFeatures])

  useEffect(() => {
    if (activeTab !== 'privacy') return
    const raw = window.location.hash.replace(/^#/, '').trim()
    if (raw !== 'seed-backup' && raw !== 'security-log') return
    requestAnimationFrame(() => {
      document.getElementById(raw)?.scrollIntoView({ block: 'start' })
    })
  }, [activeTab])

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
    <MotivatorShell activeNav="settings" wide>
      {decryptFailed ? <VaultDecryptHelp className="mb-4" /> : null}

      {savePending ? (
        <p className="mb-3 text-label-sm text-on-surface-variant" role="status" aria-live="polite">
          {t('settings.savePending')}
        </p>
      ) : savedFlash ? (
        <p className="mb-3 text-label-sm text-primary" role="status" aria-live="polite">
          {t('settings.saveDone')}
        </p>
      ) : null}

      <SettingsTabLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'general' ? (
          <div className="space-y-md">
            <div>
              <h3 className={SETTINGS_SUBHEAD}>{t('common.language')}</h3>
              <div className={`mt-3 ${SETTINGS_CARD}`}>
                <select
                  className={MOTIVATOR_INPUT}
                  value={i18n.language === 'en' ? 'en' : 'ru'}
                  onChange={(e) => void i18n.changeLanguage(e.target.value)}
                >
                  <option value="ru">{t('common.langRuFlag')}</option>
                  <option value="en">{t('common.langEnFlag')}</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className={SETTINGS_SUBHEAD}>{t('settings.accountPasswordTitle')}</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant">{t('settings.accountPasswordHelp')}</p>
              <form
                className={`mt-3 flex flex-col gap-3 ${SETTINGS_CARD}`}
                onSubmit={(e) => void handlePasswordSubmit(e)}
              >
                <label className={`flex flex-col gap-1 ${SETTINGS_LABEL}`}>
                  <span>{t('settings.currentPassword')}</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className={MOTIVATOR_INPUT}
                    value={pwCurrent}
                    disabled={!canEdit || !hasEmailLogin || pwBusy}
                    onChange={(e) => setPwCurrent(e.target.value)}
                  />
                </label>
                <label className={`flex flex-col gap-1 ${SETTINGS_LABEL}`}>
                  <span>{t('settings.newPasswordField')}</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={MOTIVATOR_INPUT}
                    value={pwNew}
                    disabled={!canEdit || !hasEmailLogin || pwBusy}
                    onChange={(e) => setPwNew(e.target.value)}
                  />
                </label>
                <label className={`flex flex-col gap-1 ${SETTINGS_LABEL}`}>
                  <span>{t('settings.confirmNewPassword')}</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={MOTIVATOR_INPUT}
                    value={pwConfirm}
                    disabled={!canEdit || !hasEmailLogin || pwBusy}
                    onChange={(e) => setPwConfirm(e.target.value)}
                  />
                </label>
                {pwError ? (
                  <p className="text-label-sm text-red-400" role="alert">
                    {pwError}
                  </p>
                ) : null}
                {pwSuccess ? (
                  <p className="text-label-sm text-primary" role="status">
                    {t('settings.passwordChanged')}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={!canEdit || !hasEmailLogin || pwBusy}
                  className={SETTINGS_BTN_SECONDARY}
                >
                  {pwBusy ? t('common.loading') : t('settings.changePasswordSubmit')}
                </button>
              </form>
            </div>

            <div>
              <h3 className={SETTINGS_SUBHEAD}>{t('settings.sectionLegal')}</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant">{t('settings.sectionLegalHelp')}</p>
              <div className={`mt-3 ${SETTINGS_CARD}`}>
                <SettingsLegalSection />
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'privacy' ? (
          <div className="space-y-md">
            <section id="seed-backup" className="scroll-mt-6">
              <h3 className={SETTINGS_SUBHEAD}>{t('settings.seedBackupTitle')}</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant">{t('settings.seedBackupHelp')}</p>
              <div className={`mt-3 ${SETTINGS_CARD}`}>
                <SeedExportPanel />
              </div>
            </section>
            <SecurityLogPanel />
          </div>
        ) : null}

        {activeTab === 'planning' ? (
          <div className="space-y-md">
        <h3 className={SETTINGS_SUBHEAD}>{t('settings.priorityLabelsTitle')}</h3>
        <p className="mt-2 text-xs text-on-surface-variant">{t('settings.priorityLabelsHelp')}</p>
        <div className={`mt-4 flex flex-col gap-3 ${SETTINGS_CARD}`}>
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

        <h3 className={`${SETTINGS_SUBHEAD} mt-8`}>{t('settings.groupsTitle')}</h3>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canEdit) return
            void addGroup(newGroupName).then(() => setNewGroupName(''))
          }}
        >
          <input
            className={`${MOTIVATOR_INPUT} flex-1`}
            placeholder={t('settings.newGroupPlaceholder')}
            value={newGroupName}
            disabled={!canEdit}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button
            type="submit"
            disabled={!canEdit}
            className={SETTINGS_BTN_SECONDARY}
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

        <h3 className={`${SETTINGS_SUBHEAD} mt-8`}>{t('settings.eodTitle')}</h3>
        <p className="mt-2 text-xs text-on-surface-variant">{t('settings.eodHelp')}</p>
        <label className={`${SETTINGS_CHECKBOX_ROW} mt-4`}>
          <input
            type="checkbox"
            className="mt-0.5"
            checked={vault.eodPreferences?.enabled !== false}
            disabled={!canEdit}
            onChange={(e) => void setEodEnabled(e.target.checked)}
          />
          <span className="text-sm leading-snug text-on-surface">{t('settings.eodToggle')}</span>
        </label>
        <h3 className={`${SETTINGS_SUBHEAD} mt-6`}>{t('settings.eodAutoCloseTitle')}</h3>
        <p className="mt-2 text-xs text-on-surface-variant">{t('settings.eodAutoCloseHelp')}</p>
        <label
          className={`${SETTINGS_CHECKBOX_ROW} mt-3 ${
            vault.eodPreferences?.enabled === false ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={vault.eodPreferences?.autoCloseAtDayEnd === true}
            disabled={!canEdit || vault.eodPreferences?.enabled === false}
            onChange={(e) => void setEodAutoCloseAtDayEnd(e.target.checked)}
          />
          <span className="text-sm leading-snug text-on-surface">{t('settings.eodAutoCloseToggle')}</span>
        </label>
        <h3 className={`${SETTINGS_SUBHEAD} mt-6`}>{t('settings.eodPushReminderTitle')}</h3>
        <p className="mt-2 text-xs text-on-surface-variant">{t('settings.eodPushReminderHelp')}</p>
        {deliveryMode === 'off' ? (
          <p className={cn('mt-2', TEXT_HINT_WARNING)}>{t('settings.eodPushReminderNeedNotifications')}</p>
        ) : null}
        <label
          className={`${SETTINGS_CHECKBOX_ROW} mt-3 ${
            vault.eodPreferences?.enabled === false || !canEdit || deliveryMode === 'off'
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={eodPushReminderOn}
            disabled={!canEdit || vault.eodPreferences?.enabled === false || deliveryMode === 'off'}
            onChange={(e) => {
              if (e.target.checked) {
                const initial =
                  typeof vault.eodPreferences?.pushReminderMinutesFromMidnight === 'number'
                    ? vault.eodPreferences.pushReminderMinutesFromMidnight
                    : EOD_DEFAULT_PUSH_REMINDER_MINUTES
                void setEodPushReminderMinutes(initial)
              } else {
                void setEodPushReminderMinutes(null)
              }
            }}
          />
          <span className="text-sm leading-snug text-on-surface">{t('settings.eodPushReminderToggle')}</span>
        </label>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-col gap-1">
            <span className={SETTINGS_LABEL}>{t('settings.eodPushReminderTime')}</span>
            <input
              type="time"
              step={60}
              className={`${MOTIVATOR_INPUT} max-w-[12rem]`}
              value={eodPushTimeValue}
              disabled={
                !canEdit || vault.eodPreferences?.enabled === false || deliveryMode === 'off' || !eodPushReminderOn
              }
              onChange={(e) => {
                const parsed = minutesFromTimeInputValue(e.target.value)
                if (parsed !== null) void setEodPushReminderMinutes(parsed)
              }}
            />
          </label>
          <button
            type="button"
            disabled={
              !canEdit ||
              vault.eodPreferences?.enabled === false ||
              deliveryMode === 'off' ||
              !eodPushReminderOn ||
              (typeof eodPushReminder !== 'number' ||
                eodPushReminder === EOD_DEFAULT_PUSH_REMINDER_MINUTES)
            }
            className={`${SETTINGS_BTN_SECONDARY} shrink-0 text-xs`}
            onClick={() => void setEodPushReminderMinutes(EOD_DEFAULT_PUSH_REMINDER_MINUTES)}
          >
            {t('settings.eodPushReminderResetDefault', {
              time: formatMinutesAsTimeValue(EOD_DEFAULT_PUSH_REMINDER_MINUTES),
            })}
          </button>
        </div>
          </div>
        ) : null}

        {activeTab === 'notifications' ? (
          <div>
        <div className={`${SETTINGS_CARD} flex flex-col gap-3`}>
          {(
            [
              ['off', t('settings.notificationsModeOff')],
              ['hybrid', t('settings.notificationsModeHybrid')],
              ['full', t('settings.notificationsModeFull')],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-start gap-2">
              <input
                type="radio"
                name="notification-delivery"
                className="mt-1"
                checked={notifModeDraft === value}
                disabled={!canEdit || notifModeSaving}
                onChange={() => setNotifModeDraft(value)}
              />
              <span className="text-sm leading-snug text-on-surface">{label}</span>
            </label>
          ))}
          <p className="text-xs text-on-surface-variant">{t('settings.notificationsModeHybridHint')}</p>
          <p className={TEXT_HINT_WARNING}>{t('settings.notificationsModeFullHint')}</p>
          <button
            type="button"
            disabled={!canEdit || !notifModeDirty || notifModeSaving}
            className="btn-primary mt-1 w-fit px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => {
              setNotifModeSaving(true)
              setNotifPushHint(null)
              const run = async () => {
                if (notifModeDraft !== 'off') {
                  const r = await subscribePushNotifications()
                  if (r === 'denied') {
                    setNotifModeDraft('off')
                    setNotifPushHint(t('settings.notificationsPermissionDenied'))
                    return
                  }
                  if (r === 'no_sw') {
                    setNotifModeDraft('off')
                    setNotifPushHint(t('settings.notificationsSwMissing'))
                    return
                  }
                  if (r === 'unconfigured') {
                    setNotifModeDraft('off')
                    setNotifPushHint(t('settings.notificationsVapidMissing'))
                    return
                  }
                }
                await setNotificationDeliveryMode(notifModeDraft)
              }
              void run().finally(() => setNotifModeSaving(false))
            }}
          >
            {notifModeSaving ? t('common.loading') : t('common.save')}
          </button>
          {notifPushHint ? <p className="text-xs text-on-surface-variant mt-1">{notifPushHint}</p> : null}
        </div>
        {deliveryMode !== 'off' ? (
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={!canEdit || testPushBusy}
              className={SETTINGS_BTN_SECONDARY}
              onClick={() => {
                setTestPushError(null)
                setTestPushBusy(true)
                void sendTestPushNotification()
                  .catch((e: unknown) => setTestPushError(e instanceof Error ? e.message : String(e)))
                  .finally(() => setTestPushBusy(false))
              }}
            >
              {testPushBusy ? t('common.loading') : t('settings.notificationsTestPush')}
            </button>
            {testPushError ? (
              <p className="text-xs text-red-400" role="alert">
                {testPushError}
              </p>
            ) : null}
            {!getVapidPublicKey() ? (
              <p className="text-xs text-on-surface-variant">{t('settings.notificationsVapidMissing')}</p>
            ) : null}
          </div>
        ) : null}
          </div>
        ) : null}

      </SettingsTabLayout>

      <p className="mt-10 text-center text-mono-data text-label-sm text-on-surface-variant">
        {t('settings.appVersion', { version: APP_VERSION })}
      </p>
    </MotivatorShell>
  )
}

export function SettingsPage() {
  return (
    <RequireVault>
      <SettingsPageInner />
    </RequireVault>
  )
}
