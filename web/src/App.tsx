import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { SessionSyncInformer } from '@/components/SessionSyncInformer'
import { AppPage } from '@/pages/AppPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LegalDocumentPage } from '@/pages/LegalDocumentPage'
import { CookieConsentGate } from '@/components/CookieConsentGate'

export function App() {
  const { session, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">{t('shell.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {session ? <SessionSyncInformer session={session} /> : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={session ? <Navigate to="/onboarding" replace /> : <LoginPage />}
        />
        <Route
          path="/onboarding"
          element={session ? <OnboardingPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/app"
          element={session ? <AppPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/app/reports"
          element={session ? <ReportsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={session ? <SettingsPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/legal/:docId" element={<LegalDocumentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsentGate />
    </div>
  )
}
