---
description: Делит задачи EOD на «сделано», «не закрыто» и напоминание по бэклогу для заданного dateKey.
glossary-type: метод
---

# partitionEodTasksByCompletion

## Определение

> [!abstract] Определение
> Делит задачи ритуала End-of-Day на блоки «сделано», «не закрыто» и мягкое напоминание по бэклогу для заданного [[dateKey#Определение|dateKey]].

^glossary-def

**Тип записи:** метод  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Параметр | Тип | Описание |
|----------|-----|----------|
| `tasks` | `Task[]` | Список задач |
| `dateKey` | `string` | Дата ритуала `YYYY-MM-DD` |
| **Возвращает** | `{ completed, remaining, backlogReminder }` | Три массива задач |

## Применение — общее упоминание

- [[12-Журнал-решений#DR-002 — End-of-day: какие задачи попадают в ритуал]]

## Применение — техническое

- [[tasksPlannedForEodRitual#Определение|tasksPlannedForEodRitual]]
- [[isMainTaskDoneForDay#Определение|isMainTaskDoneForDay]]
