-- Week 1 backend hardening: claim due fires, atomic schedule replace, defect_submissions RLS.

-- ---------------------------------------------------------------------------
-- notification_fire_requests: status `processing` for cron claim
-- ---------------------------------------------------------------------------

alter table public.notification_fire_requests
  drop constraint if exists notification_fire_requests_status_check;

alter table public.notification_fire_requests
  add constraint notification_fire_requests_status_check
  check (status in ('scheduled', 'processing', 'sent', 'cancelled', 'failed'));

-- ---------------------------------------------------------------------------
-- Cron: atomically claim due rows (service_role only)
-- ---------------------------------------------------------------------------

create or replace function public.claim_due_notification_fires(p_limit int default 150)
returns setof public.notification_fire_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int := greatest(1, least(coalesce(p_limit, 150), 500));
begin
  return query
  update public.notification_fire_requests n
  set
    status = 'processing',
    updated_at = now(),
    attempts = n.attempts + 1
  from (
    select id
    from public.notification_fire_requests
    where status = 'scheduled'
      and fire_at_utc <= now()
    order by fire_at_utc asc
    limit lim
    for update skip locked
  ) picked
  where n.id = picked.id
  returning n.*;
end;
$$;

revoke all on function public.claim_due_notification_fires(int) from public;
grant execute on function public.claim_due_notification_fires(int) to service_role;

-- ---------------------------------------------------------------------------
-- Client: replace all scheduled fires for current user in one transaction
-- ---------------------------------------------------------------------------

create or replace function public.replace_user_scheduled_fires(p_rows jsonb default '[]'::jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  delete from public.notification_fire_requests
  where user_id = uid
    and status = 'scheduled';

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    return;
  end if;

  insert into public.notification_fire_requests (
    user_id,
    task_id,
    kind,
    fire_at_utc,
    dedupe_key,
    title,
    locale,
    status
  )
  select
    uid,
    r->>'task_id',
    r->>'kind',
    (r->>'fire_at_utc')::timestamptz,
    r->>'dedupe_key',
    nullif(r->>'title', ''),
    case when r->>'locale' = 'en' then 'en' else 'ru' end,
    'scheduled'
  from jsonb_array_elements(p_rows) as r
  where coalesce(r->>'task_id', '') <> ''
    and coalesce(r->>'kind', '') <> ''
    and coalesce(r->>'fire_at_utc', '') <> ''
    and coalesce(r->>'dedupe_key', '') <> '';
end;
$$;

grant execute on function public.replace_user_scheduled_fires(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- defect_submissions: explicit deny for authenticated (writes via service role)
-- ---------------------------------------------------------------------------

drop policy if exists defect_submissions_deny_authenticated on public.defect_submissions;

create policy defect_submissions_deny_authenticated
  on public.defect_submissions
  for all
  to authenticated
  using (false)
  with check (false);
