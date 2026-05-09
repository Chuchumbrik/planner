import type { Session } from '@supabase/supabase-js'

/**
 * Роль приложения в Supabase Auth `app_metadata` (задаётся на сервере / Dashboard).
 * Клиент только читает; назначение админов — не через anon-ключ.
 */
export const MOTIVATOR_APP_ROLE_KEY = 'motivator_role' as const

export type MotivatorAppRole = 'user' | 'admin'

function readRoleRaw(session: Session | null): unknown {
  const meta = session?.user?.app_metadata as Record<string, unknown> | undefined
  return meta?.[MOTIVATOR_APP_ROLE_KEY]
}

/** Эффективная роль: по умолчанию пользователь, `admin` только при явном значении в metadata. */
export function motivatorAppRole(session: Session | null): MotivatorAppRole {
  return readRoleRaw(session) === 'admin' ? 'admin' : 'user'
}

export function isMotivatorAdmin(session: Session | null): boolean {
  return motivatorAppRole(session) === 'admin'
}
