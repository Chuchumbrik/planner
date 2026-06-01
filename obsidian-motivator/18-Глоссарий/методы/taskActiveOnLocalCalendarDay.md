---
description: Устаревшая эвристика «активности» задачи по createdAt/updatedAt/плану; для EOD и стрика не используется.
glossary-type: метод
---

# taskActiveOnLocalCalendarDay

## Определение

> [!abstract] Определение
> Проверяет, была ли задача «активна» в календарный день по `createdAt`, `updatedAt` или дате в плане. **Не** применяется для отбора End-of-Day и стрика — см. [[tasksPlannedForLocalDay#Определение|tasksPlannedForLocalDay]].

^glossary-def

**Тип записи:** метод  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Параметр | Тип | Описание |
|----------|-----|----------|
| `task` | `Task` | Задача |
| `dateKey` | `string` | Ключ дня `YYYY-MM-DD` |
| **Возвращает** | `boolean` | `true`, если эвристика «активности» выполнена |

## Применение — общее упоминание

- [[12-Журнал-решений#DR-002 — End-of-day: какие задачи попадают в ритуал]] — явно **не** используется для EOD

## Применение — техническое

- `packages/motivator-core/src/lib/eod/eodRitual.ts` — функция есть; для списков EOD вызывается [[tasksPlannedForEodRitual#Определение|tasksPlannedForEodRitual]]
