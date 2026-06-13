import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsPage } from './SettingsPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _opts?: unknown) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

vi.mock('@/components/settings/SettingsTabLayout', () => ({
  SettingsTabLayout: ({
    children,
    activeTab,
    onTabChange,
  }: {
    children: React.ReactNode
    activeTab: string
    onTabChange: (tab: string) => void
  }) => (
    <div data-testid="tab-layout" data-active-tab={activeTab}>
      <button onClick={() => onTabChange('general')}>tab:general</button>
      <button onClick={() => onTabChange('privacy')}>tab:privacy</button>
      <button onClick={() => onTabChange('planning')}>tab:planning</button>
      <button onClick={() => onTabChange('notifications')}>tab:notifications</button>
      {children}
    </div>
  ),
}))

vi.mock('@/components/settings/useSettingsTab', () => ({
  useSettingsTab: vi.fn(),
}))

vi.mock('@/components/settings/SecurityLogPanel', () => ({
  SecurityLogPanel: () => <div data-testid="security-log-panel" />,
}))

vi.mock('@/components/SeedExportPanel', () => ({
  SeedExportPanel: () => <div data-testid="seed-export-panel" />,
}))

vi.mock('@/components/SettingsLegalSection', () => ({
  SettingsLegalSection: () => <div data-testid="legal-section" />,
}))

vi.mock('@/components/VaultDecryptHelp', () => ({
  VaultDecryptHelp: ({ className }: { className?: string }) => (
    <div data-testid="decrypt-help" className={className} />
  ),
}))

vi.mock('@/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('@/vault/VaultProvider', () => ({ useVault: vi.fn() }))

vi.mock('@/components/settings/useSettingsTab', () => ({
  useSettingsTab: vi.fn(),
}))

vi.mock('@motivator/core', () => ({
  DEFAULT_GROUP_ID: 'default',
  PRIORITY_RANKS: [1, 2, 3],
  NotificationDeliveryMode: undefined,
}))

vi.mock('@/lib/notifications/pushSubscription', () => ({
  getVapidPublicKey: vi.fn(),
}))

vi.mock('@/version', () => ({ APP_VERSION: '0.7.0+abc123' }))

import { useAuth } from '@/auth/AuthProvider'
import { useVault } from '@/vault/VaultProvider'
import { useSettingsTab } from '@/components/settings/useSettingsTab'
import { getVapidPublicKey } from '@/lib/notifications/pushSubscription'

const VAULT_BASE = {
  groups: [
    { id: 'default', name: 'Default', sortOrder: 0 },
    { id: 'g2', name: 'Work', sortOrder: 1 },
  ],
  tasks: [],
  priorityLabels: { 1: 'Low', 2: 'Medium', 3: 'High' },
  eodPreferences: { enabled: true, autoCloseAtDayEnd: false },
  notificationPreferences: { deliveryMode: 'off' as const },
  eodCompletedLocalDates: [],
}

const VAULT_METHODS = {
  addGroup: vi.fn().mockResolvedValue(undefined),
  renameGroup: vi.fn().mockResolvedValue(undefined),
  deleteGroup: vi.fn().mockResolvedValue(undefined),
  setPriorityLabel: vi.fn().mockResolvedValue(undefined),
  setEodEnabled: vi.fn().mockResolvedValue(undefined),
  setEodAutoCloseAtDayEnd: vi.fn().mockResolvedValue(undefined),
  setEodPushReminderMinutes: vi.fn().mockResolvedValue(undefined),
  setNotificationDeliveryMode: vi.fn().mockResolvedValue(undefined),
  subscribePushNotifications: vi.fn().mockResolvedValue('ok'),
  sendTestPushNotification: vi.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    session: { user: { id: 'u1', email: 'test@example.com' } },
    updatePassword: vi.fn().mockResolvedValue({ error: null }),
    isAdmin: false,
    canAccessPreviewFeatures: false,
  } as any)
  vi.mocked(useVault).mockReturnValue({
    vault: VAULT_BASE,
    remoteHydrated: true,
    decryptFailed: false,
    savePending: false,
    ...VAULT_METHODS,
  } as any)
  vi.mocked(useSettingsTab).mockReturnValue(['general', vi.fn()] as any)
  vi.mocked(getVapidPublicKey).mockReturnValue(null)
})

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  )
}

describe('SettingsPage — structure', () => {
  it('renders shell wrapper', () => {
    renderPage()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })

  it('renders app version', () => {
    renderPage()
    expect(screen.getByText('settings.appVersion')).toBeInTheDocument()
  })

  it('renders tab layout', () => {
    renderPage()
    expect(screen.getByTestId('tab-layout')).toBeInTheDocument()
  })

  it('shows decrypt help when decryptFailed is true', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: true,
      decryptFailed: true,
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.getByTestId('decrypt-help')).toBeInTheDocument()
  })

  it('shows savePending status when saving', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: true,
      decryptFailed: false,
      savePending: true,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.getByText('settings.savePending')).toBeInTheDocument()
  })
})

describe('SettingsPage — general tab', () => {
  beforeEach(() => {
    vi.mocked(useSettingsTab).mockReturnValue(['general', vi.fn()] as any)
  })

  it('renders language selector', () => {
    renderPage()
    expect(screen.getByText('common.language')).toBeInTheDocument()
  })

  it('renders password change form', () => {
    renderPage()
    expect(screen.getByText('settings.accountPasswordTitle')).toBeInTheDocument()
    expect(screen.getByText('settings.changePasswordSubmit')).toBeInTheDocument()
  })

  it('renders legal section', () => {
    renderPage()
    expect(screen.getByTestId('legal-section')).toBeInTheDocument()
  })

  it('password submit button is disabled when canEdit is false', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: false,
      decryptFailed: false,
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.getByText('settings.changePasswordSubmit')).toBeDisabled()
  })

  it('shows mismatch error when new passwords differ', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('settings.currentPassword'), 'oldpass')
    await user.type(screen.getByLabelText('settings.newPasswordField'), 'newpass1')
    await user.type(screen.getByLabelText('settings.confirmNewPassword'), 'newpass2')
    await user.click(screen.getByText('settings.changePasswordSubmit'))
    expect(screen.getByRole('alert')).toHaveTextContent('settings.passwordMismatch')
  })

  it('shows too-short error when new password is under 6 chars', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('settings.newPasswordField'), 'abc')
    await user.type(screen.getByLabelText('settings.confirmNewPassword'), 'abc')
    await user.click(screen.getByText('settings.changePasswordSubmit'))
    expect(screen.getByRole('alert')).toHaveTextContent('settings.passwordTooShort')
  })

  it('shows same-as-old error when passwords match current', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('settings.currentPassword'), 'samepass')
    await user.type(screen.getByLabelText('settings.newPasswordField'), 'samepass')
    await user.type(screen.getByLabelText('settings.confirmNewPassword'), 'samepass')
    await user.click(screen.getByText('settings.changePasswordSubmit'))
    expect(screen.getByRole('alert')).toHaveTextContent('settings.passwordSameAsOld')
  })

  it('shows success message after successful password change', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('settings.currentPassword'), 'oldpass')
    await user.type(screen.getByLabelText('settings.newPasswordField'), 'newpass1')
    await user.type(screen.getByLabelText('settings.confirmNewPassword'), 'newpass1')
    await user.click(screen.getByText('settings.changePasswordSubmit'))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('settings.passwordChanged'),
    )
  })
})

describe('SettingsPage — privacy tab', () => {
  beforeEach(() => {
    vi.mocked(useSettingsTab).mockReturnValue(['privacy', vi.fn()] as any)
  })

  it('renders seed export panel', () => {
    renderPage()
    expect(screen.getByTestId('seed-export-panel')).toBeInTheDocument()
  })

  it('renders security log panel', () => {
    renderPage()
    expect(screen.getByTestId('security-log-panel')).toBeInTheDocument()
  })

  it('renders seed backup heading', () => {
    renderPage()
    expect(screen.getByText('settings.seedBackupTitle')).toBeInTheDocument()
  })
})

describe('SettingsPage — planning tab', () => {
  beforeEach(() => {
    vi.mocked(useSettingsTab).mockReturnValue(['planning', vi.fn()] as any)
  })

  it('renders priority labels section', () => {
    renderPage()
    expect(screen.getByText('settings.priorityLabelsTitle')).toBeInTheDocument()
  })

  it('renders groups section heading', () => {
    renderPage()
    expect(screen.getByText('settings.groupsTitle')).toBeInTheDocument()
  })

  it('renders existing groups', () => {
    renderPage()
    expect(screen.getByDisplayValue('Default')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Work')).toBeInTheDocument()
  })

  it('renders Add Group button', () => {
    renderPage()
    expect(screen.getByText('settings.addGroup')).toBeInTheDocument()
  })

  it('renders EOD toggle', () => {
    renderPage()
    expect(screen.getByText('settings.eodTitle')).toBeInTheDocument()
  })

  it('delete button absent for default group', () => {
    renderPage()
    // Only 'Work' group has a delete button, not 'Default'
    const deleteButtons = screen.getAllByText('common.delete')
    expect(deleteButtons).toHaveLength(1)
  })

  it('calls addGroup when form submitted with a name', async () => {
    const addGroup = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useVault).mockReturnValue({
      vault: VAULT_BASE,
      remoteHydrated: true,
      decryptFailed: false,
      savePending: false,
      ...VAULT_METHODS,
      addGroup,
    } as any)
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByPlaceholderText('settings.newGroupPlaceholder'), 'Fitness')
    await user.click(screen.getByText('settings.addGroup'))
    expect(addGroup).toHaveBeenCalledWith('Fitness')
  })
})

describe('SettingsPage — notifications tab', () => {
  beforeEach(() => {
    vi.mocked(useSettingsTab).mockReturnValue(['notifications', vi.fn()] as any)
  })

  it('renders delivery mode radio options', () => {
    renderPage()
    expect(screen.getByText('settings.notificationsModeOff')).toBeInTheDocument()
    expect(screen.getByText('settings.notificationsModeHybrid')).toBeInTheDocument()
    expect(screen.getByText('settings.notificationsModeFull')).toBeInTheDocument()
  })

  it('Save button disabled when mode not changed', () => {
    renderPage()
    expect(screen.getByText('common.save')).toBeDisabled()
  })

  it('Save button enabled after switching delivery mode', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('settings.notificationsModeHybrid'))
    expect(screen.getByText('common.save')).toBeEnabled()
  })

  it('hides test push button when deliveryMode is off', () => {
    renderPage()
    expect(screen.queryByText('settings.notificationsTestPush')).not.toBeInTheDocument()
  })

  it('shows test push button when deliveryMode is not off', () => {
    vi.mocked(useVault).mockReturnValue({
      vault: {
        ...VAULT_BASE,
        notificationPreferences: { deliveryMode: 'hybrid' as const },
      },
      remoteHydrated: true,
      decryptFailed: false,
      savePending: false,
      ...VAULT_METHODS,
    } as any)
    renderPage()
    expect(screen.queryByText('settings.notificationsEnablePush')).not.toBeInTheDocument()
    expect(screen.getByText('settings.notificationsTestPush')).toBeInTheDocument()
  })
})
