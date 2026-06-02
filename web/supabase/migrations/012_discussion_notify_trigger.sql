-- Phase 7.10 — Discussions notifications: триггер на новый reply → web-push подписчикам.
-- AFTER INSERT в admin_discussion_replies вызывает Edge `admin-discussions-notify`
-- через pg_net (net.http_post, встроено в Supabase) fire-and-forget — если Edge
-- недоступна, reply всё равно сохраняется (push — nice-to-have, не блокирует flow).
--
-- ВАЖНО — перед работой триггера в проекте должны быть настроены GUC-секреты
-- (стандартный паттерн pg_net в Supabase), иначе триггер тихо пропускает push:
--   alter database postgres set app.settings.supabase_url      = 'https://<ref>.supabase.co';
--   alter database postgres set app.settings.service_role_key  = '<service_role_key>';
-- current_setting(..., true) возвращает NULL если GUC не задан (не бросает ошибку).

-- pg_net — async HTTP из Postgres (встроено в Supabase). Нужен для net.http_post.
create extension if not exists pg_net with schema extensions;

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
  service_key := current_setting('app.settings.service_role_key', true);
  edge_url := current_setting('app.settings.supabase_url', true);

  -- Секреты не настроены — тихо выходим, не ломая вставку reply.
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

-- Триггер-функция не должна быть вызываема как RPC (anon/authenticated).
revoke execute on function public.notify_discussion_reply() from public, anon, authenticated;

drop trigger if exists discussion_reply_notify on public.admin_discussion_replies;
create trigger discussion_reply_notify
  after insert on public.admin_discussion_replies
  for each row execute function public.notify_discussion_reply();
