import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; session: Session | null }>
  signOut: () => Promise<void>
  /** Проверка текущего пароля через повторный вход, затем Supabase `updateUser`. */
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo(
    () => ({ session, loading, signIn, signUp, signOut, updatePassword }),
    [session, loading, signIn, signUp, signOut, updatePassword],
  )

  if (!isSupabaseConfigured) {
    return (
      <AuthContext.Provider
        value={{
          session: null,
          loading: false,
          signIn: async () => ({
            error: new Error('Задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY'),
          }),
          signUp: async () => ({
            error: new Error('Задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY'),
            session: null,
          }),
          signOut: async () => {},
          updatePassword: async () => ({
            error: new Error('Задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY'),
          }),
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}
