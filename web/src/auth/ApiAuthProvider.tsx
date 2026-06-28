import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  apiLoadSession,
  apiLogin,
  apiLogout,
  apiRegister,
  apiRequestPasswordReset,
  apiUpdatePassword,
} from '@/api/authClient'
import { isMotivatorAdmin, isMotivatorBetaTester, isMotivatorTesterOrAdmin } from '@/lib/motivatorRole'
import { AuthContext, type AuthContextValue } from './authContext'

export function ApiAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiLoadSession()
      .then((next) => {
        if (!cancelled) setSession(next)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const next = await apiLogin(email, password)
      setSession(next)
      return { error: null as Error | null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const next = await apiRegister(email, password)
      setSession(next)
      return { error: null as Error | null, session: next }
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error(String(err)),
        session: null as Session | null,
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    await apiLogout()
    setSession(null)
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    return apiRequestPasswordReset(email)
  }, [])

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    return apiUpdatePassword(currentPassword, newPassword)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      isAdmin: isMotivatorAdmin(session),
      isBetaTester: isMotivatorBetaTester(session),
      canAccessPreviewFeatures: isMotivatorTesterOrAdmin(session),
    }),
    [session, loading, signIn, signUp, signOut, requestPasswordReset, updatePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
