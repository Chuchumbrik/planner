---
description: Квадрант матрицы Эйзенхауэра q1–q4 или null (Inbox) для задачи в режиме prioritySystem eisenhower (v3).
glossary-type: переменная
---

# eisenhowerQuadrant

## Определение

> [!abstract] Определение
> Квадрант матрицы Эйзенхауэра `q1`–`q4` или `null` (Inbox) для задачи при [[prioritySystem#Определение|prioritySystem]] `"eisenhower"` (vault v3).

^glossary-def

**Тип записи:** переменная  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Аспект | Значение |
|--------|----------|
| Тип | `"q1"` \| `"q2"` \| `"q3"` \| `"q4"` \| `null` |
| `null` | Inbox — задача вне квадрантов |

## Применение — общее упоминание

- [[12-Журнал-решений#DR-003 — Эйзенхауэр и Inbox]]

## Применение — техническое

- [[normalizeVault#Определение|normalizeVault]] — маппинг в [[priorityRank#Определение|priorityRank]]
