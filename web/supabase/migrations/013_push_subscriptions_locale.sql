-- Phase 7.10 — локаль подписки для локализованного текста push.
-- Используется Edge admin-discussions-notify (buildDiscussionReplyPayload),
-- заполняется клиентом при upsert push-подписки (язык интерфейса на момент подписки).
alter table public.push_subscriptions
  add column if not exists locale text not null default 'ru'
  check (locale in ('ru', 'en'));
