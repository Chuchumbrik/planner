-- Phase 7.8 — Discussions backend (3/4): отметки прочтения (для unread-бейджа).
-- Запись (mark-read upsert) — через Edge (service role). Чтение — только своих строк.

create table if not exists public.admin_discussion_read (
  user_id uuid not null references auth.users (id) on delete cascade,
  discussion_id uuid not null references public.admin_discussions (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, discussion_id)
);

alter table public.admin_discussion_read enable row level security;

create policy "own read-state select" on public.admin_discussion_read
  for select to authenticated
  using (user_id = auth.uid());
