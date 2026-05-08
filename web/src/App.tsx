import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { AppPage } from '@/pages/AppPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
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
          path="/settings"
          element={session ? <SettingsPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
