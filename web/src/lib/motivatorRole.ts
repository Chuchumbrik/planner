import type { Session } from '@supabase/supabase-js'

/**
 * Роль приложения в Supabase Auth `app_metadata` (задаётся на сервере / Dashboard).
 * Клиент только читает; назначение ролей — не через anon-ключ.
 *
 * Значения `motivator_role`: `admin` | `beta_tester` | (нет или иное) → обычный пользователь.
 */
export const MOTIVATOR_APP_ROLE_KEY = 'motivator_role' as const

export type MotivatorAppRole = 'user' | 'beta_tester' | 'admin'

function readRoleRaw(session: Session | null): unknown {
  const meta = session?.user?.app_metadata as Record<string, unknown> | undefined
  return meta?.[MOTIVATOR_APP_ROLE_KEY]
}

/** Эффективная роль: по умолчанию `user`; явные `admin` и `beta_tester` из metadata. */
export function motivatorAppRole(session: Session | null): MotivatorAppRole {
  const r = readRoleRaw(session)
  if (r === 'admin') return 'admin'
  if (r === 'beta_tester') return 'beta_tester'
  return 'user'
}

export function isMotivatorAdmin(session: Session | null): boolean {
  return motivatorAppRole(session) === 'admin'
}

export function isMotivatorBetaTester(session: Session | null): boolean {
  return motivatorAppRole(session) === 'beta_tester'
}
