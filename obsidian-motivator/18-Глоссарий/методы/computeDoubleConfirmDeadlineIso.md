---
description: Вычисляет ISO-момент окончания окна двойного подтверждения: firstStep + interval + grace.
glossary-type: метод
---

# computeDoubleConfirmDeadlineIso

## Определение

> [!abstract] Определение
> Вычисляет ISO-момент окончания окна двойного подтверждения: `firstStepAtIso` + [[doubleConfirmIntervalMinutes#Определение|interval]] + [[doubleConfirmGraceMinutes#Определение|grace]] (минуты).

^glossary-def

**Тип записи:** метод  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Параметр | Тип | Описание |
|----------|-----|----------|
| `firstStepAtIso` | `string` | ISO-время первого шага |
| `intervalMin` | `number` | Минуты до второго напоминания |
| `graceMin` | `number` | Минуты окна после напоминания |
| **Возвращает** | `string` | ISO `confirmDeadlineIso` |

## Применение — общее упоминание

- [[12-Журнал-решений#DR-004 — Двойное подтверждение: пропуск второго шага]]

## Применение — техническое

- [[applyToggleTask#Определение|applyToggleTask]]
