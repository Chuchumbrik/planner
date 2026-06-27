---
id: pr-and-code-review
title: PR и code review
class: guidance
scope: [cursor, claude]
applies-when: перед открытием PR, при ревью чужого/своего diff, перед merge — чеклист проекта и отдельный субагент code-reviewer
globs: ["**/*"]
enforcement: none
status: active
links: [code-reviewer, plan-before-implement, engineering-craft, tests-for-new-code, pre-commit-docs-roadmap, security-hygiene, layer-boundaries-and-ports, adr-and-architecture-decisions]
---

# PR и code review

**Правило:** merge-ready PR — не «компилируется», а **проходит чеклист ниже**. Автор делает self-review;
независимое ревью — субагент [[code-reviewer]] или человек **в отдельном контексте** (не автор кода).

## Когда вызывать code-reviewer

| Ситуация | Действие |
|----------|----------|
| PR > ~300 строк логики или >5 файлов core/API | Task `/code-reviewer` или subagent `code-reviewer` |
| Vault, auth, crypto, migration | **обязательно** независимое ревью |
| Мелкий fix, docs-only | self-review достаточно |
| Автор = единственный агент в чате | **новый** чат/Task для reviewer |

Субагент **read-only**: не правит код, выдаёт findings + verdict.

## Self-review автора (до push)

1. [[plan-before-implement]] — план выполнен или отклонения объяснены.
2. [[engineering-craft]] — post-write checklist.
3. `cd web && npx vitest run` (+ core/API workspaces при необходимости).
4. Гейты локально: `node scripts/check-gates/tests-for-new-code.mjs`, `pre-commit-docs.mjs`.
5. Diff без секретов; README/roadmap если продуктовый код ([[pre-commit-docs-roadmap]]).

## Чеклист ревью (проект)

### Scope и процесс

- [ ] Один PR — одна цель (фича / кластер миграции / fix).
- [ ] Нет смешения refactor+feature без причины.
- [ ] Test-contour: тесты не писал автор фичи ([[tests-by-independent-agent]]).

### Архитектура и код

- [ ] [[layer-boundaries-and-ports]] — слой, порты, нет supabase в новом UI.
- [ ] Vault/crypto — [[vault-and-crypto-invariants]] если релевантно.
- [ ] UI — [[react-ui-conventions]] (i18n, a11y).
- [ ] Amvera — [[amvera-migration-orchestrator]] + migration skills если релевантно.
- [ ] API — [[api-http-contracts]] + [[api-implementation-and-logging]] если `services/planner-api`.

### Безопасность

- [ ] [[security-hygiene]] — authz server-side, no secrets, no ciphertext logs.

### Тесты и CI

- [ ] [[tests-for-new-code]] — колокация на каждый logic source.
- [ ] E2E — если сквозной риск ([[autotest-writer]] / CI e2e).

### Документация

- [ ] README, Obsidian, ADR ([[adr-and-architecture-decisions]]) при смене контракта/архитектуры.

## Формат PR (gh)

```markdown
## Summary
- …

## Plan / cluster (migration)
- …

## Test plan
- [ ] vitest
- [ ] e2e (if applicable)

## Review
- [ ] self-review
- [ ] code-reviewer (link/findings)
```

## Verdict code-reviewer

| Verdict | Значение |
|---------|----------|
| **approve** | merge-ready |
| **request-changes** | blockers listed |
| **comment** | nitpicks only, author decides |

Blockers — must-fix; nits — optional.

## Связанные skills

[[code-reviewer]], [[engineering-craft]], [[test-contour-orchestrator]]
