-- Audit log for admin role changes.
-- Every time an admin changes a user's motivator_role via the Edge Function,
-- a row is inserted here. Rows are append-only (no update/delete via RLS).

create table if not exists admin_role_audit_log (
  id            uuid primary key default gen_random_uuid(),
  changed_by    uuid not null,   -- auth.uid() of the admin who made the change
  target_user_id uuid not null,  -- user whose role was changed
  old_role      text not null,   -- previous role value
  new_role      text not null,   -- new role value
  changed_at    timestamptz not null default now()
);

-- Only service-role key can insert; admins (authenticated) can read.
alter table admin_role_audit_log enable row level security;

create policy "service role insert" on admin_role_audit_log
  for insert to service_role with check (true);

create policy "admins read" on admin_role_audit_log
  for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'motivator_role') = 'admin'
  );

-- Index for looking up history of a specific user.
create index if not exists admin_role_audit_log_target_idx
  on admin_role_audit_log (target_user_id, changed_at desc);
