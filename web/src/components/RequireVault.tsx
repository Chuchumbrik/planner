import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { useVault } from '@/vault/VaultProvider'

export function RequireVault({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { ready, unlocked } = useVault()

  if (!session) return <Navigate to="/login" replace />
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">{t('shell.initCrypto')}</p>
      </div>
    )
  }
  if (!unlocked) return <Navigate to="/onboarding" replace />
  return children
}
