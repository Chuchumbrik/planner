---
description: Состояние ожидания второго подтверждения «сделано» за локальный календарный день задачи.
glossary-type: переменная
---

# doubleConfirmPending

## Определение

> [!abstract] Определение
> Состояние ожидания второго подтверждения «сделано» за локальный календарный день задачи; содержит `localDate`, `firstStepAtIso`, `confirmDeadlineIso`.

^glossary-def

**Тип записи:** переменная  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Поле | Тип | Описание |
|------|-----|----------|
| `localDate` | `string` | Ключ дня `YYYY-MM-DD` |
| `firstStepAtIso` | `string` | ISO-время первого шага |
| `confirmDeadlineIso` | `string` | ISO-конец окна (interval + grace от первого шага) |
| Расположение | на задаче | `Task.doubleConfirmPending` |

### Поля объекта (превью по наведению)

> [!note] localDate  
> Ключ календарного дня ожидания второго шага, формат `YYYY-MM-DD`.

^glossary-def-localDate

> [!note] firstStepAtIso  
> ISO-время первого нажатия галочки «выполнено».

^glossary-def-firstStepAtIso

> [!note] confirmDeadlineIso  
> ISO-время конца окна: `firstStepAtIso` + [[effectiveDoubleConfirmIntervalMin#Определение|effectiveDoubleConfirmIntervalMin]] + [[effectiveDoubleConfirmGraceMin#Определение|effectiveDoubleConfirmGraceMin]].

^glossary-def-confirmDeadlineIso

## Применение — общее упоминание

- [[12-Журнал-решений#DR-004 — Двойное подтверждение: пропуск второго шага]] — поля [[doubleConfirmPending#^glossary-def-localDate|localDate]], [[doubleConfirmPending#^glossary-def-firstStepAtIso|firstStepAtIso]], [[doubleConfirmPending#^glossary-def-confirmDeadlineIso|confirmDeadlineIso]]

## Применение — техническое

- [[applyToggleTask#Определение|applyToggleTask]]
- [[applyExpireStaleDoubleConfirm#Определение|applyExpireStaleDoubleConfirm]]
