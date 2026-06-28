import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { maybeRecordAppActivity } from '@/lib/adminActivityPing'
import { isMotivatorAdmin, isMotivatorBetaTester, isMotivatorTesterOrAdmin } from '@/lib/motivatorRole'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthContextValue } from './authContext'

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    maybeRecordAppActivity(supabase)
  }, [session])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase не настроен') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase)
      return { error: new Error('Supabase не настроен'), session: null as Session | null }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return {
      error: error ? new Error(error.message) : null,
      session: data.session ?? null,
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Supabase не настроен') }
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!supabase) return { error: new Error('Supabase не настроен') }
      const email = session?.user?.email
      if (!email) return { error: new Error('Нет email в сессии') }

      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (verifyErr) return { error: new Error(verifyErr.message) }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      return { error: error ? new Error(error.message) : null }
    },
    [session?.user?.email],
  )

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
