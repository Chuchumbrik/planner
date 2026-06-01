-- Phase 7.8 — Discussions backend (4/4): подписки на уведомления по треду.
-- Запись (subscribe/unsubscribe) — через Edge (service role). Чтение — только своих строк.

create table if not exists public.admin_discussion_subscribers (
  user_id uuid not null references auth.users (id) on delete cascade,
  discussion_id uuid not null references public.admin_discussions (id) on delete cascade,
  subscribed_at timestamptz not null default now(),
  primary key (user_id, discussion_id)
);

alter table public.admin_discussion_subscribers enable row level security;

create policy "own subscription select" on public.admin_discussion_subscribers
  for select to authenticated
  using (user_id = auth.uid());
