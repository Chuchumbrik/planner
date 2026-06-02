import { fireEvent, render, screen } from '@testing-library/react'
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

// ── Phase 7.12 — swipe-to-resolve / fallback-кнопка ──────────────────────────

describe('DiscussionList — swipe-to-resolve (Phase 7.12)', () => {
  function swipeContainer(el: HTMLElement): HTMLElement {
    // Обёртка SwipeableItem — ближайший относительный контейнер вокруг кнопки строки.
    return el.closest('div.relative') as HTMLElement
  }

  it('open-тред: fallback-кнопка «Решить» присутствует с aria-label', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'admin.discussions.resolveSwipeAria' }),
    ).toBeInTheDocument()
  })

  it('swipe влево по open-треду показывает overlay и зовёт onResolveSwipe', () => {
    const onResolveSwipe = vi.fn()
    render(
      <DiscussionList
        discussions={[makeDiscussion({ id: 'd-open', status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={onResolveSwipe}
      />,
    )
    const container = swipeContainer(screen.getByText('Тред с телом'))
    fireEvent.pointerDown(container, { pointerType: 'touch', clientX: 200 })
    fireEvent.pointerUp(container, { pointerType: 'touch', clientX: 100 })
    // После свайпа — overlay-кнопка «Решить» (текст резолва) + клик зовёт колбэк.
    const resolveButtons = screen.getAllByRole('button', { name: 'admin.discussions.resolveSwipeAria' })
    fireEvent.click(resolveButtons[resolveButtons.length - 1])
    expect(onResolveSwipe).toHaveBeenCalledWith('d-open')
  })

  it('не-open тред: fallback-кнопка/overlay отсутствуют (disabled)', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'synced' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={() => {}}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'admin.discussions.resolveSwipeAria' }),
    ).not.toBeInTheDocument()
  })

  it('без onResolveSwipe кнопка не появляется даже для open-треда', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'admin.discussions.resolveSwipeAria' }),
    ).not.toBeInTheDocument()
  })

  it('overlay несёт класс animate-swipe-reveal (guard reduced-motion — в CSS)', () => {
    const { container } = render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={() => {}}
      />,
    )
    const wrap = swipeContainer(screen.getByText('Тред с телом'))
    fireEvent.pointerDown(wrap, { pointerType: 'touch', clientX: 200 })
    fireEvent.pointerUp(wrap, { pointerType: 'touch', clientX: 100 })
    expect(container.querySelector('.animate-swipe-reveal')).toBeTruthy()
  })

  it('свайп мышью игнорируется (overlay не появляется) — поведение десктопа не меняется', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={() => {}}
      />,
    )
    const container = swipeContainer(screen.getByText('Тред с телом'))
    fireEvent.pointerDown(container, { pointerType: 'mouse', clientX: 200 })
    fireEvent.pointerUp(container, { pointerType: 'mouse', clientX: 100 })
    // Overlay не показан → только одна (fallback) кнопка резолва.
    expect(
      screen.getAllByRole('button', { name: 'admin.discussions.resolveSwipeAria' }),
    ).toHaveLength(1)
  })

  // TS-P01 (Must) — pointerCancel сбрасывает жест: после cancel pointerUp не открывает overlay.
  it('TS-P01: pointerCancel сбрасывает жест — последующий pointerUp не открывает overlay', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={() => {}}
      />,
    )
    const container = swipeContainer(screen.getByText('Тред с телом'))
    fireEvent.pointerDown(container, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerCancel(container, { pointerType: 'touch' })
    fireEvent.pointerUp(container, { pointerType: 'touch', clientX: 50, clientY: 100 })
    // Жест отменён → overlay нет, только одна fallback-кнопка.
    expect(
      screen.getAllByRole('button', { name: 'admin.discussions.resolveSwipeAria' }),
    ).toHaveLength(1)
  })

  // TS-P02 (Must) — повторный pointerDown после cancel возобновляет отслеживание (позитивный путь).
  it('TS-P02: повторный pointerDown после cancel снова отслеживает свайп и открывает overlay', () => {
    const onResolveSwipe = vi.fn()
    render(
      <DiscussionList
        discussions={[makeDiscussion({ id: 'd-open', status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={onResolveSwipe}
      />,
    )
    const container = swipeContainer(screen.getByText('Тред с телом'))
    // Первый жест отменён.
    fireEvent.pointerDown(container, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerCancel(container, { pointerType: 'touch' })
    // Новый жест после cancel — должен сработать.
    fireEvent.pointerDown(container, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerUp(container, { pointerType: 'touch', clientX: 100, clientY: 100 })
    const resolveButtons = screen.getAllByRole('button', { name: 'admin.discussions.resolveSwipeAria' })
    fireEvent.click(resolveButtons[resolveButtons.length - 1])
    expect(onResolveSwipe).toHaveBeenCalledWith('d-open')
  })

  // TS-P03 (Must) — вертикальный скролл (|dy| > |dx|) НЕ открывает overlay.
  it('TS-P03: вертикальный жест (|dy| > |dx|) не открывает overlay', () => {
    render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={() => {}}
      />,
    )
    const container = swipeContainer(screen.getByText('Тред с телом'))
    // dx = -70 (за порогом), но dy = -200 — преимущественно вертикальный жест.
    fireEvent.pointerDown(container, { pointerType: 'touch', clientX: 200, clientY: 300 })
    fireEvent.pointerUp(container, { pointerType: 'touch', clientX: 130, clientY: 100 })
    // Overlay не открыт → только одна fallback-кнопка.
    expect(
      screen.getAllByRole('button', { name: 'admin.discussions.resolveSwipeAria' }),
    ).toHaveLength(1)
  })

  // TS-P06 (Must) — кнопка «close» в overlay скрывает overlay без вызова onResolveSwipe.
  it('TS-P06: кнопка close скрывает overlay и не зовёт onResolveSwipe', () => {
    const onResolveSwipe = vi.fn()
    render(
      <DiscussionList
        discussions={[makeDiscussion({ status: 'open' })]}
        loadBusy={false}
        loadError={null}
        onSelect={() => {}}
        onCreateClick={() => {}}
        onRetry={() => {}}
        onResolveSwipe={onResolveSwipe}
      />,
    )
    const container = swipeContainer(screen.getByText('Тред с телом'))
    fireEvent.pointerDown(container, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerUp(container, { pointerType: 'touch', clientX: 100, clientY: 100 })
    // Overlay открыт.
    expect(screen.getByRole('button', { name: 'common.close' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    // Overlay скрыт, резолв не вызван.
    expect(screen.queryByRole('button', { name: 'common.close' })).not.toBeInTheDocument()
    expect(onResolveSwipe).not.toHaveBeenCalled()
  })
})
