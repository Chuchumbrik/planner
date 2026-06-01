---
description: Считает долю закрытия плана на календарный день для кольца прогресса EOD (doneFraction и plannedTaskCount).
glossary-type: метод
---

# plannedDayCompletionWeights

## Определение

> [!abstract] Определение
> Считает долю закрытия плана на календарный день: сумма вкладов задач (`doneFraction`) и число задач в плане (`plannedTaskCount`) для кольца прогресса в модалке End-of-Day.

^glossary-def

**Тип записи:** метод  
**Версия:** 1.0  
**Дата:** 2026-05-30

## Принимаемые типы данных

| Параметр | Тип | Описание |
|----------|-----|----------|
| `plannedTasksForDay` | `Task[]` | Задачи плана на день |
| `dateKey` | `string` | Ключ дня `YYYY-MM-DD` |
| **Возвращает** | `{ doneFraction, plannedTaskCount }` | см. поля ниже |

### Поля результата (превью по наведению)

> [!note] doneFraction  
> Сумма вкладов задач плана на день в диапазоне 0…`plannedTaskCount` (чек-лист даёт долю от 0 до 1 на задачу).

^glossary-def-doneFraction

> [!note] plannedTaskCount  
> Число задач в плане на день (знаменатель для процента в кольце EOD).

^glossary-def-plannedTaskCount

## Применение — общее упоминание

- [[12-Журнал-решений#DR-002 — End-of-day: какие задачи попадают в ритуал]] — кольцо прогресса; поля [[plannedDayCompletionWeights#^glossary-def-doneFraction|doneFraction]], [[plannedDayCompletionWeights#^glossary-def-plannedTaskCount|plannedTaskCount]]

## Применение — техническое

- [[isMainTaskDoneForDay#Определение|isMainTaskDoneForDay]] — вклад задачи без чек-листа
- `web/src/components/EndOfDayModal.tsx` — отображение процента в кольце
