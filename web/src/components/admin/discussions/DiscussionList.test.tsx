import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DiscussionList, previewLine } from './DiscussionList'
import type { Discussion } from '@/lib/discussionsApi'

// i18n / relativeTime — стабильные стабы, чтобы тесты не зависели от локали.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/lib/relativeTime', () => ({
  relativeDayLabel: () => 'today',
}))

// ── Группа B — previewLine (BUG-1, §7.9 AC-3) ───────────────────────────────

describe('previewLine', () => {
  // TS-B01 — обычный однострочный body.
  it('returns a plain single line as-is', () => {
    expect(previewLine('Это обычный текст')).toBe('Это обычный текст')
  })

  // TS-B02 — markdown-заголовок первой строки срезается.
  it('strips leading markdown heading marker from first line', () => {
    expect(previewLine('# Заголовок\nТекст тела')).toBe('Заголовок')
  })

  // TS-B03 — первая строка пустая → берётся следующая непустая.
  it('skips empty leading lines and uses the first non-empty one', () => {
    expect(previewLine('\n\nПервый непустой')).toBe('Первый непустой')
  })

  // TS-B04 — undefined → пустая строка.
  it('returns empty string for undefined body', () => {
    expect(previewLine(undefined)).toBe('')
  })

  // TS-B05 — обрезка до 140 символов.
  it('truncates the preview to at most 140 chars', () => {
    expect(previewLine('a'.repeat(200)).length).toBeLessThanOrEqual(140)
  })
})

// ── TS-B06 — Integration / BUG-1: превью рендерится при непустом body ─────────
// На уровне компонента DiscussionList корректно рендерит строку-превью, когда
// `body` присутствует. BUG-1 — в проде `action: list` не возвращает `body`, поэтому
// превью никогда не видно. Этот тест фиксирует контракт рендера: если бэкенд
// начнёт отдавать body/preview, превью обязано появиться.

function makeDiscussion(overrides: Partial<Discussion> = {}): Discussion {
  return {
    id: 'd1',
    title: 'Тред с телом',
    status: 'open',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    reply_count: 0,
    last_reply_at: null,
    linked_journal_entry: null,
    linked_version: null,
    body: 'Первая строка превью тела',
    ...overrides,
  }
}

describe('DiscussionList — body preview rendering (TS-B06, BUG-1)', () => {
  it('renders the preview line under the title when body is present', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion()]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
      />,
    )
    expect(screen.getByText('Первая строка превью тела')).toBeInTheDocument()
  })

  it('omits the preview line when body is absent (current prod behaviour from list action)', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion({ body: undefined })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
      />,
    )
    // Заголовок виден, но строки-превью нет — воспроизведение BUG-1 на данных без body.
    expect(screen.getByText('Тред с телом')).toBeInTheDocument()
    expect(screen.queryByText('Первая строка превью тела')).not.toBeInTheDocument()
  })
})
