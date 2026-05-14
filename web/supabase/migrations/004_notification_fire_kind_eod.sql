-- Web Push: расширение kind для напоминания EOD (см. computeScheduledFires, pushPayload).

alter table public.notification_fire_requests
  drop constraint if exists notification_fire_requests_kind_check;

alter table public.notification_fire_requests
  add constraint notification_fire_requests_kind_check
  check (kind in ('task_start', 'task_end', 'eod_reminder'));
