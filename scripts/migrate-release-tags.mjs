#!/usr/bin/env node
/**
 * Phase 7.1 — Data model + Migration tags.
 *
 * Одноразовая (идемпотентная) миграция данных `web/src/data/productRoadmap.ts`:
 *   1. Бэкфилл `tag` на каждый элемент `RELEASE_NOTES_BLOCKS` (conventional-commit стиль).
 *      Авто-классификация по словарю ключевых слов в ПЕРВОМ change (заголовок выпуска),
 *      с fallback на весь элемент. Неуверенные/переопределённые — через карту OVERRIDES.
 *   2. Бэкфилл `status: 'proposed'` на каждую идею `IDEAS_LATER_ENTRIES`
 *      (кроме псевдо-группы `postmvp_intro` — это интро-карточка, не идея).
 *   3. `current: true` на текущую фазу в `MVP_PHASES_PLANNED` (Phase 7).
 *
 * Запуск:
 *   node scripts/migrate-release-tags.mjs           # dry-run: печатает таблицу, файл не трогает
 *   node scripts/migrate-release-tags.mjs --apply    # записывает изменения в файл
 *
 * Acceptance (см. obsidian-motivator/20-Phase-7-План-краткой-сводки.md §7.1):
 *   - Все release-items имеют tag.
 *   - tsc -p tsconfig.app.json --noEmit — clean.
 *   - Существующие компоненты не сломаны (все новые поля optional).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dirname, '..', 'web', 'src', 'data', 'productRoadmap.ts')
const APPLY = process.argv.includes('--apply')

const TAGS = ['feat', 'fix', 'refactor', 'docs', 'chore', 'test', 'build', 'ci', 'perf', 'style']

/**
 * Ручные переопределения там, где словарь ошибается или текст неоднозначен.
 * Версия НЕ уникальна (0.7.3 — 9 items и т.п.), поэтому матчим по подстроке
 * ПЕРВОГО change (заголовка выпуска). Первое совпадение выигрывает.
 * Заполнено после ревью dry-run таблицы (§7.1 «Ручная разметка ambiguous»).
 */
const OVERRIDES = [
  ['подсказки на карточках метрик переписаны', 'docs'],
  ['сворачиваемый **sidebar**', 'feat'],
  ['виджет **End of Day** открывает ритуал', 'feat'],
  ['расписание срабатываний для **повторяющихся**', 'feat'],
  ['список плана на день сортируется', 'feat'],
  ['навигация **День** и **Месяц** — та же строка', 'feat'],
  ['Задокументирован дефект MVP', 'docs'],
  ['Чек-лист:** отметки «выполнено»', 'feat'],
  ['schemaVersion: 8', 'feat'],
  ['списки строятся только по задачам, запланированным', 'feat'],
  ['Тестирование:** для **`admin`**', 'feat'],
  ['вход через **сторонние провайдеры**', 'feat'],
  ['добавлена карточка **тестовые аккаунты', 'feat'],
  ['после выхода новой версии приложения', 'feat'],
  ['План до 1.0.0** (`MVP_PHASES_PLANNED`', 'docs'],
  ['смена роли на **обычный пользователь** снова сохр', 'fix'],
  ['README (cron):** в **`web/README.md`** зафиксирован', 'docs'],
  ['Версия продукта 0.6.1 в package.json', 'build'],
  ['зафиксировано **обязательное** обновление', 'docs'],
]

function overrideFor(headText) {
  for (const [frag, tag] of OVERRIDES) {
    if (headText.includes(frag)) return tag
  }
  return null
}

/**
 * Словарь ключевых слов → tag. Порядок массива = приоритет при множественных совпадениях
 * (раньше в списке — выше приоритет как «заголовок» выпуска).
 * Совпадения ищутся в нижнем регистре по тексту первого change.
 */
const RULES = [
  // perf — только явная производительность, не «плавность» анимаций
  ['perf', ['n+1', 'производительност', 'ускорен', 'оптимизаци', 'оптимизир', 'виртуализац', 'мемоизац', 'usememo', 'usecallback', 'дебаунс', 'debounce', 'throttle', 'ленивая загрузка', 'lazy load', 'кэширован', 'кеширован']],
  // fix — явный ремонт сломанного
  ['fix', ['исправлен', 'исправл', 'фикс', 'починен', 'почин', ' баг', 'ошибк', 'падал', 'ломал', 'сломан', 'не работал', 'не срабат', 'регресс', 'краш', 'крэш', 'вылет', 'зависал', 'race condition', 'гонк', 'утечк', 'некоррект', 'неверн', 'мигал', 'дёрга', 'дерга', 'перекрыва', 'не перекрыва', 'терял', 'сбрасыва', 'восстановлен', 'нет больше горизонтального', 'без горизонтального скролл']],
  // refactor — реструктуризация без смены поведения
  ['refactor', ['рефактор', 'вынесен', 'устранено дублирование', 'дедупликац', 'переименован', 'упрощен', 'упрощён', 'extracted', 'общую утилит', 'общий хук', 'boilerplate', 'реорганизов', 'разнесён по', 'единый источник']],
  // test — только про автотесты
  ['test', ['vitest', 'playwright', 'юнит-тест', 'unit test', 'e2e-тест', 'e2e тест', 'снапшот-тест', 'snapshot test', 'покрыт тест', 'покрытие тест', 'добавлен тест', 'добавлены тест']],
  // docs — документация/ноты/Obsidian
  ['docs', ['документац', 'readme', 'changelog', 'релиз-нот', 'комментар', 'obsidian', 'журнал решений', 'задокументирован', 'обновлены тексты', 'синхронизирован', 'правил релиз']],
  // build — тулчейн/сборка/зависимости
  ['build', ['сборка', 'vite ', 'package.json', 'зависимост', 'bundle', 'бандл', 'tsconfig', 'eslint', 'prettier', 'pwa', 'service worker', 'sw (']],
  // ci — пайплайн/деплой-конфиг
  ['ci', ['github actions', 'pr-checks', 'pipeline', 'vercel.json', 'cron', 'serverless', 'workflow-скрипт']],
  // style — чисто косметика, без поведения
  ['style', ['отступ', 'padding', 'margin', 'палитр', 'шрифт', 'типографик', 'скруглен', 'градиент', 'выравниван', 'вёрстк', 'верстк']],
  // feat — всё новое/видимое поведение (включая анимации); fallback перед chore
  ['feat', ['добавлен', 'добавл', 'новый', 'новая', 'новое', 'новые', 'теперь можно', 'теперь ', 'реализован', 'появил', 'включ', 'поддержк', 'введен', 'введён', 'анимац', 'кнопк', 'экран', 'модал', 'фильтр', 'график', 'диаграмм', 'кольцо', 'переключател', 'возможност', 'позволяет', 'редизайн', 'bento', 'hero', 'меню', 'sidebar', 'онбординг', 'напоминан']],
]

function classify(headText, fullText) {
  for (const source of [headText, fullText]) {
    const low = source.toLowerCase()
    for (const [tag, kws] of RULES) {
      if (kws.some((k) => low.includes(k))) return tag
    }
  }
  return 'chore'
}

const raw = readFileSync(FILE, 'utf8')
const lines = raw.split('\n')

// ── Pass 1: классификация release-items ───────────────────────────────────────
const reVersion = /^(\s*)releasedInVersion: \{ ru: '([^']+)'/
const reRu = /^\s*ru: '(.*)',?\s*$/
const reBlockBoundary = /releasedInVersion:|dateLabel:/

const report = []
const out = []
let i = 0
while (i < lines.length) {
  const line = lines[i]
  const m = line.match(reVersion)
  if (!m) {
    out.push(line)
    i++
    continue
  }
  const indent = m[1]
  const version = m[2]
  // уже размечено? (следующая непустая строка — tag:)
  const alreadyTagged = (lines[i + 1] || '').trim().startsWith('tag:')

  // собрать текст: первый change (head) и весь item (full)
  let headText = ''
  const fullParts = []
  for (let j = i + 1; j < lines.length; j++) {
    if (reBlockBoundary.test(lines[j])) break
    const rm = lines[j].match(reRu)
    if (rm) {
      if (!headText) headText = rm[1]
      fullParts.push(rm[1])
    }
  }
  const ov = overrideFor(headText)
  const tag = ov || classify(headText, fullParts.join(' '))
  report.push({ version, tag, override: !!ov, already: alreadyTagged, head: headText.slice(0, 70) })

  out.push(line)
  if (!alreadyTagged) out.push(`${indent}tag: '${tag}',`)
  i++
}

// ── Pass 2: бэкфилл idea status + Pass 3: current phase ───────────────────────
const ideasStart = out.findIndex((l) => l.includes('export const IDEAS_LATER_ENTRIES'))
const reTitle = /^(\s*)title: \{?/
const reIdeaGroup = /ideaLaterGroup: '([^']+)'/
let ideasBackfilled = 0
if (ideasStart >= 0) {
  for (let k = ideasStart; k < out.length; k++) {
    const tm = out[k].match(reTitle)
    if (!tm) continue
    const indent = tm[1]
    // только поля entry (4 пробела), не nested
    if (indent.length !== 4) continue
    // уже есть status в этом entry? смотрим назад до открытия объекта
    let hasStatus = false
    let group = ''
    for (let b = k - 1; b >= 0 && !/^\s*\{\s*$/.test(out[b]); b--) {
      if (/^\s*status:/.test(out[b])) hasStatus = true
      const gm = out[b].match(reIdeaGroup)
      if (gm) group = gm[1]
    }
    if (hasStatus) continue
    if (group === 'postmvp_intro') continue // интро-карточка — не идея
    out.splice(k, 0, `${indent}status: 'proposed',`)
    ideasBackfilled++
    k++ // перешагнуть вставленную строку
  }
}

// current: true на Phase 7 (первый плановый блок с id: 7)
let phaseMarked = false
const plannedStart = out.findIndex((l) => l.includes('export const MVP_PHASES_PLANNED'))
if (plannedStart >= 0) {
  for (let k = plannedStart; k < out.length; k++) {
    const im = out[k].match(/^(\s*)id: 7,\s*$/)
    if (!im) continue
    const alreadyCurrent = (out[k + 1] || '').includes('current:')
    if (!alreadyCurrent) {
      out.splice(k + 1, 0, `${im[1]}current: true,`)
      phaseMarked = true
    } else {
      phaseMarked = true
    }
    break
  }
}

// ── Отчёт ─────────────────────────────────────────────────────────────────────
const counts = {}
for (const r of report) counts[r.tag] = (counts[r.tag] || 0) + 1
console.log(`\nRelease-items: ${report.length}`)
console.log('Распределение тегов:', counts)
const chores = report.filter((r) => r.tag === 'chore' && !r.override)
console.log(`\n${'ver'.padEnd(9)} ${'tag'.padEnd(9)} src   head`)
for (const r of report) {
  const src = r.override ? 'OVR' : r.already ? 'has' : 'auto'
  console.log(`${r.version.padEnd(9)} ${r.tag.padEnd(9)} ${src.padEnd(5)} ${r.head}`)
}
if (chores.length) {
  console.log(`\n⚠ Неуверенные (chore по умолчанию) — добавь в OVERRIDES при необходимости: ${chores.map((r) => r.version).join(', ')}`)
}
console.log(`\nIdeas backfilled (status:proposed): ${ideasBackfilled}`)
console.log(`Phase 7 current: ${phaseMarked ? 'ok' : 'НЕ найдено'}`)

if (APPLY) {
  writeFileSync(FILE, out.join('\n'), 'utf8')
  console.log('\n✅ Записано в', FILE)
} else {
  console.log('\n(dry-run — файл не изменён; запусти с --apply для записи)')
}
