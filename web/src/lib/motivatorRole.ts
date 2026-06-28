import type { Session } from '@supabase/supabase-js'

/** Minimal session shape for roles (Supabase Session or API-built session). */
export type AuthSessionLike = Pick<Session, 'user'> | null

/**
 * Роль приложения в `app_metadata.motivator_role` (API auth или Supabase Auth).
 * Клиент только читает; назначение ролей — не через anon-ключ.
 *
 * Значения `motivator_role`: `admin` | `beta_tester` | (нет или иное) → обычный пользователь.
 */
export const MOTIVATOR_APP_ROLE_KEY = 'motivator_role' as const

export type MotivatorAppRole = 'user' | 'beta_tester' | 'admin'

function readRoleRaw(session: AuthSessionLike): unknown {
  const meta = session?.user?.app_metadata as Record<string, unknown> | undefined
  return meta?.[MOTIVATOR_APP_ROLE_KEY]
}

/** Эффективная роль: по умолчанию `user`; явные `admin` и `beta_tester` из metadata. */
export function motivatorAppRole(session: AuthSessionLike): MotivatorAppRole {
  const r = readRoleRaw(session)
  if (r === 'admin') return 'admin'
  if (r === 'beta_tester') return 'beta_tester'
  return 'user'
}

export function isMotivatorAdmin(session: AuthSessionLike): boolean {
  return motivatorAppRole(session) === 'admin'
}

export function isMotivatorBetaTester(session: AuthSessionLike): boolean {
  return motivatorAppRole(session) === 'beta_tester'
}

/** Прототипы, AI-заглушка и прочий preview UI — только admin и beta_tester. */
export function isMotivatorTesterOrAdmin(session: AuthSessionLike): boolean {
  const r = motivatorAppRole(session)
  return r === 'admin' || r === 'beta_tester'
}
