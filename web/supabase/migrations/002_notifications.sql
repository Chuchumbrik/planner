-- Web Push: подписки устройств и расписание срабатываний (открытые поля; vault по-прежнему ciphertext).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------

create table if not exists public.notification_fire_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id text not null,
  kind text not null check (kind in ('task_start', 'task_end')),
  fire_at_utc timestamptz not null,
  dedupe_key text not null,
  title text,
  locale text not null default 'ru' check (locale in ('ru', 'en')),
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled', 'failed')),
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists notification_fire_requests_due_idx
  on public.notification_fire_requests (status, fire_at_utc)
  where status = 'scheduled';

create index if not exists notification_fire_requests_user_idx
  on public.notification_fire_requests (user_id);

alter table public.notification_fire_requests enable row level security;

create policy "notification_fire_requests_select_own"
  on public.notification_fire_requests for select
  using (auth.uid() = user_id);

create policy "notification_fire_requests_insert_own"
  on public.notification_fire_requests for insert
  with check (auth.uid() = user_id);

create policy "notification_fire_requests_update_own"
  on public.notification_fire_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notification_fire_requests_delete_own"
  on public.notification_fire_requests for delete
  using (auth.uid() = user_id);
