-- Хранилище зашифрованного vault на пользователя (см. obsidian-motivator/14-V1-минимальный-запуск-Vercel.md)

create table if not exists public.user_vault (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ciphertext text not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_vault enable row level security;

create policy "user_vault_select_own"
  on public.user_vault for select
  using (auth.uid() = user_id);

create policy "user_vault_insert_own"
  on public.user_vault for insert
  with check (auth.uid() = user_id);

create policy "user_vault_update_own"
  on public.user_vault for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_vault_delete_own"
  on public.user_vault for delete
  using (auth.uid() = user_id);
