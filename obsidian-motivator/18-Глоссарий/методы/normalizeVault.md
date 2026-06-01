---
description: Нормализует и мигрирует vault между schemaVersion; v3→v4 переводит приоритеты в priorityRank.
glossary-type: метод
---

# normalizeVault

## Определение

> [!abstract] Определение
> Нормализует и мигрирует vault между версиями `schemaVersion`; при v3→v4 переводит [[eisenhowerQuadrant#Определение|eisenhowerQuadrant]] / [[priorityLevel#Определение|priorityLevel]] в [[priorityRank#Определение|priorityRank]].

^glossary-def

**Тип записи:** метод  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Параметр | Тип | Описание |
|----------|-----|----------|
| raw | unknown | Сырые данные vault |
| **Возвращает** | `VaultPayload` | Актуальная схема (v8+) |

## Применение — общее упоминание

- [[12-Журнал-решений#DR-003 — Эйзенхауэр и Inbox]]

## Применение — техническое

- `@motivator/core` — `vault/normalize.ts`
