# Feature delivery workflow — справка

Кратко; полный порядок — [SKILL.md](SKILL.md) и [pipeline-agents.md](pipeline-agents.md).

## Права GitHub для агента

Как в **`github-defect-workflow`**: пользователь **предоставил права** на `gh`, MCP GitHub (если подключён), PR/issue, push по сценарию. **Использовать** до фактической ошибки среды.

## Git: перед веткой фичи

Как для дефектов: **`git fetch origin`** → **`git checkout main`** → **`git pull origin main`** (или merge `origin/main`) → **`git checkout -b feature/<slug>-…`**. Подробно — раздел **«Ветка и PR от main»** в [pipeline-agents.md](pipeline-agents.md).

## Issue / PR

- В теле PR для автозакрытия связанных issue — **`Fixes #N`** / **`Closes`** / **`Resolves`** (см. [документацию GitHub](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)).
- Если фича **без** issue — в итоговой таблице поле GitHub — **`—`**.
