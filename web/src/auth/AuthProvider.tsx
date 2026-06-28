import { useContext, type ReactNode } from 'react'
import { isApiConfigured } from '@/lib/apiConfig'
import { isSupabaseConfigured } from '@/lib/supabase'
import { ApiAuthProvider } from './ApiAuthProvider'
import { AuthContext } from './authContext'
import { SupabaseAuthProvider } from './SupabaseAuthProvider'

function UnconfiguredAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        session: null,
        loading: false,
        isAdmin: false,
        isBetaTester: false,
        canAccessPreviewFeatures: false,
        signIn: async () => ({
          error: new Error('Задайте VITE_API_URL (Amvera) или VITE_SUPABASE_* (legacy Vercel)'),
        }),
        signUp: async () => ({
          error: new Error('Задайте VITE_API_URL (Amvera) или VITE_SUPABASE_* (legacy Vercel)'),
          session: null,
        }),
        signOut: async () => {},
        requestPasswordReset: async () => ({
          error: new Error('Задайте VITE_API_URL (Amvera) или VITE_SUPABASE_* (legacy Vercel)'),
        }),
        updatePassword: async () => ({
          error: new Error('Задайте VITE_API_URL (Amvera) или VITE_SUPABASE_* (legacy Vercel)'),
        }),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/** API (Amvera) takes precedence over Supabase when both env vars are present. */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (isApiConfigured()) return <ApiAuthProvider>{children}</ApiAuthProvider>
  if (isSupabaseConfigured) return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  return <UnconfiguredAuthProvider>{children}</UnconfiguredAuthProvider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}
