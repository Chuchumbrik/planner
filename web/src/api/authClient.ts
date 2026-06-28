import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '@/api/client'
import { clearStoredTokens, readStoredTokens, storeTokens } from '@/api/authStorage'

export type ApiAuthUser = {
  id: string
  email: string
  motivator_role: string
  plan_tier: string
  vault_encryption_enabled: boolean
}

type TokenResponse = {
  user: ApiAuthUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export function apiUserToSession(user: ApiAuthUser, accessToken: string): Session {
  return {
    access_token: accessToken,
    refresh_token: '',
    expires_in: 900,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      app_metadata: { motivator_role: user.motivator_role },
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  } as Session
}

export async function apiLogin(email: string, password: string): Promise<Session> {
  const data = await apiFetch<TokenResponse>('/api/auth/login', {
    method: 'POST',
    json: { email, password },
  })
  storeTokens(data.accessToken, data.refreshToken)
  return apiUserToSession(data.user, data.accessToken)
}

export async function apiRegister(email: string, password: string): Promise<Session> {
  const data = await apiFetch<TokenResponse>('/api/auth/register', {
    method: 'POST',
    json: { email, password },
  })
  storeTokens(data.accessToken, data.refreshToken)
  return apiUserToSession(data.user, data.accessToken)
}

export async function apiLogout(): Promise<void> {
  const { refreshToken } = readStoredTokens()
  try {
    if (refreshToken) {
      await apiFetch('/api/auth/logout', { method: 'POST', json: { refreshToken } })
    }
  } finally {
    clearStoredTokens()
  }
}

export async function apiRefreshSession(): Promise<Session | null> {
  const { refreshToken } = readStoredTokens()
  if (!refreshToken) return null
  try {
    const data = await apiFetch<TokenResponse>('/api/auth/refresh', {
      method: 'POST',
      json: { refreshToken },
    })
    storeTokens(data.accessToken, data.refreshToken)
    return apiUserToSession(data.user, data.accessToken)
  } catch {
    clearStoredTokens()
    return null
  }
}

export async function apiLoadSession(): Promise<Session | null> {
  const { accessToken } = readStoredTokens()
  if (!accessToken) return apiRefreshSession()

  try {
    const data = await apiFetch<{ user: ApiAuthUser }>('/api/auth/me', {
      method: 'GET',
      accessToken,
    })
    return apiUserToSession(data.user, accessToken)
  } catch {
    return apiRefreshSession()
  }
}

export async function apiRequestPasswordReset(_email: string): Promise<{ error: Error | null }> {
  return {
    error: new Error('Сброс пароля по email на API — в разработке (SMTP)'),
  }
}

export async function apiUpdatePassword(
  _currentPassword: string,
  _newPassword: string,
): Promise<{ error: Error | null }> {
  return { error: new Error('Смена пароля на API — в разработке') }
}
