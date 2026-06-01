-- Phase 7.10 — авторизация Edge `admin-discussions-notify` через общий секрет в Vault.
-- Платформенный ключ, который функция получает в env (SUPABASE_SERVICE_ROLE_KEY), на
-- разных проектах бывает в разном формате (legacy JWT vs новый sb_secret_), из-за чего
-- прямое строковое сравнение входящего Bearer-токена с env даёт ложный 401.
-- Решение: функция сверяет токен с тем же vault-секретом, что шлёт триггер
-- (`discussion_notify_service_key`), через эту RPC. Сравнение — в БД (SECURITY DEFINER),
-- секрет наружу не отдаётся; execute — только service_role.
create or replace function public.discussion_notify_check(token text)
  returns boolean
  language sql
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'discussion_notify_service_key'
      and decrypted_secret = token
  );
$$;

revoke execute on function public.discussion_notify_check(text) from public, anon, authenticated;
grant execute on function public.discussion_notify_check(text) to service_role;
