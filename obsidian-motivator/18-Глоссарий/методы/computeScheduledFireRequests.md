---
description: Формирует строки расписания Web Push на горизонте 14 дней (старт/конец задачи, напоминание EOD; DR-004 — в доработке).
glossary-type: метод
---

# computeScheduledFireRequests

## Определение

> [!abstract] Определение
> Формирует список будущих срабатываний Web Push для синхронизации в `notification_fire_requests`: старт и конец задачи по `timeMode`, напоминание EOD; второй push двойного подтверждения (DR-004) **пока не входит** в расчёт.

^glossary-def

**Тип записи:** метод  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Параметр | Тип | Описание |
|----------|-----|----------|
| `vault` | `VaultPayload` | Расшифрованный vault пользователя |
| `deliveryMode` | `'off' \| 'hybrid' \| 'full'` | Режим доставки push |
| `locale` | `'ru' \| 'en'` | Локаль текстов |
| **Возвращает** | `FireRowInput[]` | Строки с `kind`, `fire_at_utc`, `dedupe_key` |

Текущие значения `kind`: `task_start`, `task_end`, `eod_reminder`. Целевое для DR-004: срабатывание в `firstStepAtIso` + [[effectiveDoubleConfirmIntervalMin#Определение|effectiveDoubleConfirmIntervalMin]](task).

## Применение — общее упоминание

- [[12-Журнал-решений#DR-004 — Двойное подтверждение: пропуск второго шага]] — планирование второго push (TODO)
- [[13-Черновики-решений#DR-014 (черновик) — Push-уведомления (PWA)]]

## Применение — техническое

- `web/src/lib/notifications/computeScheduledFires.ts`
- `web/src/lib/notifications/syncNotificationSchedule.ts` — debounce после изменения vault
