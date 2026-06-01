-- Phase 7.8 — Discussions backend (1/4): треды обсуждений админа.
-- Записи — через Edge `admin-discussions` (service role). Чтение — admin/beta по RLS.

create table if not exists public.admin_discussions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,                                       -- markdown
  status text not null default 'open'
    check (status in ('open', 'pending-journal', 'synced', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id) on delete cascade,
  resolution_summary text,                                  -- open → pending-journal
  linked_journal_entry text,                                -- "DR-016", при pending-journal → synced
  linked_version text,                                      -- "0.7.20", опционально
  reply_count int not null default 0,
  last_reply_at timestamptz
);

comment on table public.admin_discussions is
  'Треды обсуждений админа (Phase 7.8). Записи — Edge admin-discussions (service role); чтение — admin/beta по RLS.';

create index if not exists admin_discussions_status_reply_idx
  on public.admin_discussions (status, last_reply_at desc nulls last);

alter table public.admin_discussions enable row level security;

-- Чтение — admin и beta_tester; запись только через Edge (service role обходит RLS).
create policy "staff read discussions" on public.admin_discussions
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'motivator_role') in ('admin', 'beta_tester'));
