import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { SessionSyncInformer } from '@/components/SessionSyncInformer'
import { AppPage } from '@/pages/AppPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LegalDocumentPage } from '@/pages/LegalDocumentPage'
import { AiInsightsPrototypePage } from '@/pages/prototypes/AiInsightsPrototypePage'
import { DeepFocusPrototypePage } from '@/pages/prototypes/DeepFocusPrototypePage'
import { MeetingsPrototypePage } from '@/pages/prototypes/MeetingsPrototypePage'
import { RequireAdmin } from '@/components/auth/RequireAdmin'
import { RequireTesterPreview } from '@/components/auth/RequireTesterPreview'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminDiscussionsPage } from '@/pages/AdminDiscussionsPage'
import { AdminRoadmapPage } from '@/pages/AdminRoadmapPage'
import { AdminTestingPage } from '@/pages/AdminTestingPage'
import { CookieConsentGate } from '@/components/CookieConsentGate'

function SwNotificationNavigation() {
  const navigate = useNavigate()

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | null
      if (data?.type !== 'motivator:navigate' || typeof data.url !== 'string') return
      try {
        const target = new URL(data.url, window.location.origin)
        if (target.origin !== window.location.origin) return
        navigate(`${target.pathname}${target.search}${target.hash}`)
      } catch {
        /* ignore malformed url */
      }
    }
    navigator.serviceWorker?.addEventListener('message', onMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage)
  }, [navigate])

  return null
}

export function App() {
  const { session, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
        <p className="text-sm text-on-surface-variant">{t('shell.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SwNotificationNavigation />
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
        <Route
          path="/prototype/deep-focus"
          element={
            session ? (
              <RequireTesterPreview>
                <DeepFocusPrototypePage />
              </RequireTesterPreview>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/prototype/ai-insights"
          element={
            session ? (
              <RequireTesterPreview>
                <AiInsightsPrototypePage />
              </RequireTesterPreview>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/prototype/meetings"
          element={
            session ? (
              <RequireAdmin>
                <MeetingsPrototypePage />
              </RequireAdmin>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/prototype/security-log"
          element={<Navigate to="/settings#security-log" replace />}
        />
        <Route
          path="/prototype/admin-dashboard"
          element={<Navigate to="/admin/dashboard?tab=summary" replace />}
        />
        <Route
          path="/admin/access"
          element={<Navigate to="/admin/dashboard?tab=users" replace />}
        />
        <Route
          path="/admin/dashboard"
          element={
            session ? (
              <RequireAdmin>
                <AdminDashboardPage />
              </RequireAdmin>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/roadmap"
          element={
            session ? (
              <RequireTesterPreview>
                <AdminRoadmapPage />
              </RequireTesterPreview>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/discussions"
          element={
            session ? (
              <RequireTesterPreview>
                <AdminDiscussionsPage />
              </RequireTesterPreview>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/discussions/:id"
          element={
            session ? (
              <RequireTesterPreview>
                <AdminDiscussionsPage />
              </RequireTesterPreview>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/testing"
          element={
            session ? (
              <RequireTesterPreview>
                <AdminTestingPage />
              </RequireTesterPreview>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/legal/:docId" element={<LegalDocumentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsentGate />
    </div>
  )
}
