import type { MotivatorRoleRow } from '@/components/AdminMotivatorRolePanel'

export function parseMotivatorRoleListResponse(raw: unknown): MotivatorRoleRow[] | null {
  if (!Array.isArray(raw)) return null
  const next: MotivatorRoleRow[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const email = typeof o.email === 'string' ? o.email : ''
    const created_at = typeof o.created_at === 'string' ? o.created_at : ''
    const last_sign_in_at =
      o.last_sign_in_at === null ? null : typeof o.last_sign_in_at === 'string' ? o.last_sign_in_at : null
    const r = o.motivator_role
    const motivator_role =
      r === 'admin' || r === 'beta_tester' || r === 'user' ? r : ('user' as const)
    if (id) next.push({ id, email, created_at, last_sign_in_at, motivator_role })
  }
  return next
}
