import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

type Props = {
  children: ReactNode
}

/** Маршруты и UI preview (прототипы, AI-заглушка) — только admin и beta_tester. */
export function RequireTesterPreview({ children }: Props) {
  const { t } = useTranslation()
  const { session, loading, canAccessPreviewFeatures } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">{t('shell.loading')}</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!canAccessPreviewFeatures) return <Navigate to="/app" replace />

  return children
}
