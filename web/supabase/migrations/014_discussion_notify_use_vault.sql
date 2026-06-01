-- Phase 7.10 — переводим триггер уведомлений с GUC (app.settings.*) на Supabase Vault.
-- На проекте роль postgres НЕ имеет права `ALTER DATABASE ... SET`, поэтому GUC-подход
-- из миграции 012 недоступен (permission denied и в дашборде, и через MCP). Vault —
-- штатное место для секретов; читается из SECURITY DEFINER функции (владелец postgres,
-- имеет доступ к vault). Секреты по именам:
--   'discussion_notify_url'         — адрес проекта (https://<ref>.supabase.co)
--   'discussion_notify_service_key' — legacy service_role JWT (для auth в Edge)
-- Заводятся один раз через vault.create_secret(...) (см. README/PR), без ALTER DATABASE.
create or replace function public.notify_discussion_reply()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  edge_url text;
  service_key text;
begin
  select decrypted_secret into edge_url
    from vault.decrypted_secrets where name = 'discussion_notify_url';
  select decrypted_secret into service_key
    from vault.decrypted_secrets where name = 'discussion_notify_service_key';

  -- Любого секрета нет — тихо выходим, не ломая вставку reply.
  if service_key is null or edge_url is null then
    return new;
  end if;

  perform net.http_post(
    url     := edge_url || '/functions/v1/admin-discussions-notify',
    body    := jsonb_build_object(
                 'discussion_id',   new.discussion_id,
                 'reply_author_id', new.created_by
               ),
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || service_key
               )
  );
  return new;
end;
$$;

revoke execute on function public.notify_discussion_reply() from public, anon, authenticated;
