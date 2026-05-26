import type { SupabaseClient } from '@supabase/supabase-js'
import { ACTIVITY_PING_THROTTLE_MS } from '@/lib/adminMonitoringConstants'

const STORAGE_KEY = 'motivator_admin_activity_ping_v1'

/** Best-effort heartbeat; failures are ignored (table may be missing before migration). */
export function maybeRecordAppActivity(supabase: SupabaseClient): void {
  if (typeof window === 'undefined') return
  try {
    const last = window.localStorage.getItem(STORAGE_KEY)
    if (last) {
      const t = Number(last)
      if (!Number.isNaN(t) && Date.now() - t < ACTIVITY_PING_THROTTLE_MS) return
    }
  } catch {
    return
  }

  void supabase.functions.invoke('admin-record-activity', { body: {} }).then(({ error }) => {
    if (error) return
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  })
}
