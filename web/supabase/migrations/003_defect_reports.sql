-- Дефекты из приложения: лог отправок (rate limit в будущем), черновики вложений для очистки, bucket Storage.

create table if not exists public.defect_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.defect_submissions is 'Факт отправки дефекта; записывает Edge (service role). Для будущего rate limit; QA-роли сейчас не ограничиваются.';

create index if not exists defect_submissions_user_time_idx
  on public.defect_submissions (user_id, created_at desc);

alter table public.defect_submissions enable row level security;

create table if not exists public.defect_attachment_drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  draft_id uuid not null,
  storage_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  primary key (user_id, draft_id)
);

comment on table public.defect_attachment_drafts is 'Черновики вложений defect-attachments/{user_id}/{draft_id}/…; строки без submitted_at старше 24ч удаляет Edge defect-attachments-cleanup.';

create index if not exists defect_attachment_drafts_cleanup_idx
  on public.defect_attachment_drafts (created_at)
  where submitted_at is null;

alter table public.defect_attachment_drafts enable row level security;

create policy defect_attachment_drafts_select_own
  on public.defect_attachment_drafts for select to authenticated
  using (user_id = auth.uid());

create policy defect_attachment_drafts_insert_own
  on public.defect_attachment_drafts for insert to authenticated
  with check (user_id = auth.uid());

create policy defect_attachment_drafts_update_own
  on public.defect_attachment_drafts for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy defect_attachment_drafts_delete_own
  on public.defect_attachment_drafts for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: приватный bucket, только свой префикс {user_id}/…

drop policy if exists defect_attachments_select_own on storage.objects;
drop policy if exists defect_attachments_insert_own on storage.objects;
drop policy if exists defect_attachments_update_own on storage.objects;
drop policy if exists defect_attachments_delete_own on storage.objects;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'defect-attachments',
  'defect-attachments',
  false,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = excluded.public;

create policy defect_attachments_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'defect-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy defect_attachments_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'defect-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy defect_attachments_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'defect-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'defect-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy defect_attachments_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'defect-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  );
