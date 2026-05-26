export type MotivatorRoleRow = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  motivator_role: 'admin' | 'beta_tester' | 'user'
  has_vault: boolean
  vault_updated_at: string | null
  push_device_count: number
  push_last_seen_at: string | null
  defect_submission_count: number
  defect_last_at: string | null
}

export type AdminActivityChart = {
  days: number
  role: 'all' | 'admin' | 'beta_tester' | 'user'
  timezone: 'UTC'
  series: Array<{ date: string; unique_users: number }>
  dau_today: number
  wau: number
}

export type AdminOverview = {
  total_users: number
  registered_last_7d: number
  signed_in_last_7d: number
  with_vault: number
  without_vault: number
  vault_stale_14d: number
  with_push: number
  defect_submissions_7d: number
  by_role: { admin: number; beta_tester: number; user: number }
  stale_vault_days: number
}
