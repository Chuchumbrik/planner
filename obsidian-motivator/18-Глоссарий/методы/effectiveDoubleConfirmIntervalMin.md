---
description: Возвращает эффективный интервал (мин.) до второго напоминания для задачи с учётом default 10.
glossary-type: метод
---

# effectiveDoubleConfirmIntervalMin

## Определение

> [!abstract] Определение
> Возвращает эффективный интервал в минутах до второго напоминания для задачи: [[doubleConfirmIntervalMinutes#Определение|doubleConfirmIntervalMinutes]] или default 10.

^glossary-def

**Тип записи:** метод  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Параметр | Тип | Описание |
|----------|-----|----------|
| `task` | `Task` | Задача с опциональным interval |
| **Возвращает** | `number` | Минуты 1–1440 |

## Применение — общее упоминание

- [[12-Журнал-решений#DR-004 — Двойное подтверждение: пропуск второго шага]] — момент второго push

## Применение — техническое

- [[computeDoubleConfirmDeadlineIso#Определение|computeDoubleConfirmDeadlineIso]]
