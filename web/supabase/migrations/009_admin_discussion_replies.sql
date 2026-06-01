-- Phase 7.8 — Discussions backend (2/4): ответы в тредах + триггер счётчика.

create table if not exists public.admin_discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.admin_discussions (id) on delete cascade,
  body text not null,                                       -- markdown
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id) on delete cascade
);

create index if not exists admin_discussion_replies_discussion_idx
  on public.admin_discussion_replies (discussion_id, created_at);

alter table public.admin_discussion_replies enable row level security;

create policy "staff read replies" on public.admin_discussion_replies
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'motivator_role') in ('admin', 'beta_tester'));

-- На новый reply: bump reply_count + last_reply_at у треда.
create or replace function public.bump_discussion_on_reply()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.admin_discussions
    set reply_count = reply_count + 1,
        last_reply_at = new.created_at,
        updated_at = now()
    where id = new.discussion_id;
  return new;
end;
$$;

-- Триггер-функция не должна быть вызываема как RPC (anon/authenticated) — триггер работает и без EXECUTE-гранта.
revoke execute on function public.bump_discussion_on_reply() from public, anon, authenticated;

drop trigger if exists admin_discussion_replies_bump on public.admin_discussion_replies;
create trigger admin_discussion_replies_bump
  after insert on public.admin_discussion_replies
  for each row execute function public.bump_discussion_on_reply();
