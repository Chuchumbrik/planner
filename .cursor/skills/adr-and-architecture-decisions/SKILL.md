---
id: adr-and-architecture-decisions
title: ADR и архитектурные решения
class: guidance
scope: [cursor, claude]
applies-when: меняется граница системы, контракт, инфраструктура, security model, продуктовый trade-off — зафиксировать DR/ADR до или в том же PR
globs: ["obsidian-motivator/**", "packages/motivator-core/**", "services/**", "web/src/**", "docs/**"]
enforcement: none
status: active
links: [plan-before-implement, layer-boundaries-and-ports, documentation-orientation, russian-requirements-writing-skill, pr-and-code-review, amvera-migration-orchestrator]
---

# ADR и архитектурные решения

**Источник истины команды:** `obsidian-motivator/12-Журнал-решений.md` (DR-xxx), дополнение — `08-Архитектура.md`, `11-Модель-данных-концептуально.md`.

**Правило:** спорное или необратимое решение **не живёт только в коде и чате** — запись в журнале **в том же PR**, что реализация (или PR «решение» раньше кода).

## Когда писать DR (обязательно)

- Новый внешний сервис, смена хosting (Amvera, DR-019).
- Breaking change `@motivator/core`, `schemaVersion`, crypto contract.
- Free/paid vault model, auth model, API public contract.
- Отказ от технологии (Supabase path deprecated).
- Trade-off с альтернативами (why not X).

## Когда достаточно комментария в PR

- Локальный refactor без смены контракта.
- Bugfix, восстанавливающий задокументированное поведение.
- UI polish без новых обязательств.

## Алгоритм

1. **[[plan-before-implement]]** — если решение влияет на scope, зафиксировать вопрос в «противоречиях».
2. **Проверить** существующие DR — не противоречить ([[documentation-orientation]]).
3. **Черновик DR** — шаблон ниже; русский текст — [[russian-requirements-writing-skill]].
4. **Обновить** `08-Архитектура.md` / `10-Каталог-…` при смене границ или user flow.
5. **PR** — ссылка `DR-0XX` в описании; [[pr-and-code-review]].

## Шаблон DR (краткий)

```markdown
## DR-0XX — Заголовок (YYYY-MM-DD)

**Статус:** Принято | В обсуждении | Отменено
**Связанные DR:** …

**Вопрос:** …

**Решение**
…

**Обоснование**
…

**Влияние**
- Код: …
- Доки: …
- Миграция: …
```

Нумерация: следующий свободный DR в журнале (сейчас смотреть конец `12-Журнал-решений.md`).

## Amvera / migration

Крупные решения переезда — в DR + `22-План-миграции-Amvera.md`. Пример: **DR-019**. Блокер **0.3** (free tier) — **ADR до кода vault**.

## Claude / Cursor

- Claude: plugin `/adr-create` + этот skill.
- Cursor: skill `adr-and-architecture-decisions`; при архитектурном запросе — plan → DR draft → код.

## PR checklist

- [ ] DR добавлен/обновлён при необходимости
- [ ] Архитектура и каталог функций синхронизированы
- [ ] README — если меняется сопровождение или контракт для пользователя
- [ ] Нет противоречия с принятыми DR без явного supersede

## Связанные файлы

| Изменение | Файл |
|-----------|------|
| Решение | `obsidian-motivator/12-Журнал-решений.md` |
| Архитектура | `obsidian-motivator/08-Архитектура.md` |
| User flow | `obsidian-motivator/09-User-Flow-одного-дня.md` |
| Модель данных | `obsidian-motivator/11-Модель-данных-концептуально.md` |
| Функции | `obsidian-motivator/10-Каталог-функций-и-взаимодействий.md` |
| Открытые вопросы | `obsidian-motivator/99-Открытые-вопросы-к-команде.md` |
