import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

type Props = {
  children: ReactNode
}

/** Маршруты админ-панели — только motivator_role admin. */
export function RequireAdmin({ children }: Props) {
  const { t } = useTranslation()
  const { session, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">{t('shell.loading')}</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/app" replace />

  return children
}
