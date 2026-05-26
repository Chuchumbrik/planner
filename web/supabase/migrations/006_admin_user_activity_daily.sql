-- Admin monitoring: один ping в день на пользователя (UTC). Без маршрутов и vault.
-- Retention 90 дней — периодический DELETE в Dashboard/cron (см. web/README.md).

create table if not exists public.admin_user_activity_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  motivator_role text not null default 'user' check (motivator_role in ('admin', 'beta_tester', 'user')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

comment on table public.admin_user_activity_daily is
  'Факт открытия приложения ≥1 раз в календарный UTC-день; пишет Edge admin-record-activity; чтение агрегатов — admin-motivator-roles activityChart.';

create index if not exists admin_user_activity_daily_date_idx
  on public.admin_user_activity_daily (activity_date desc);

create index if not exists admin_user_activity_daily_date_role_idx
  on public.admin_user_activity_daily (activity_date desc, motivator_role);

alter table public.admin_user_activity_daily enable row level security;

-- Прямой SELECT для authenticated запрещён; запись — через Edge (service role).
