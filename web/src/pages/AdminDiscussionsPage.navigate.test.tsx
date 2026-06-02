import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminDiscussionsPage } from './AdminDiscussionsPage'
import type { Discussion } from '@/lib/discussionsApi'

// Phase 7.12 — интеграция: реальный DiscussionList внутри AdminDiscussionsPage,
// onResolveSwipe должен навигировать на /admin/discussions/:id (свайп и fallback-кнопка).

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/components/RequireVault', () => ({
  RequireVault: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/MotivatorShell', () => ({
  MotivatorShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const openThread: Discussion = {
  id: 'thread-open',
  title: 'Открытый тред',
  status: 'open',
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
  reply_count: 0,
  last_reply_at: null,
  linked_journal_entry: null,
  linked_version: null,
  body: 'Тело открытого треда',
} as Discussion

// Непустой список (текущие smoke-тесты страницы всегда возвращают []).
vi.mock('@/components/admin/discussions/useDiscussions', () => ({
  useDiscussions: () => ({ discussions: [openThread], loadBusy: false, loadError: null, reload: () => {} }),
}))

vi.mock('@/components/admin/discussions/useDiscussionThread', () => ({
  useDiscussionThread: () => ({
    discussion: null,
    replies: [],
    subscribed: false,
    loadBusy: false,
    loadError: null,
    reload: () => {},
  }),
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/discussions']}>
      <Routes>
        <Route path="/admin/discussions" element={<AdminDiscussionsPage />} />
        <Route path="/admin/discussions/:id" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminDiscussionsPage — onResolveSwipe → navigate (Phase 7.12)', () => {
  // TS-Q01 (Must) — свайп по open-треду → навигация на /admin/discussions/:id.
  it('TS-Q01: свайп влево по open-треду навигирует на тред', () => {
    renderPage()
    const wrap = screen.getByText('Открытый тред').closest('div.relative') as HTMLElement
    fireEvent.pointerDown(wrap, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerUp(wrap, { pointerType: 'touch', clientX: 100, clientY: 100 })
    // Overlay-кнопка «Решить» → зовёт onResolveSwipe → navigate.
    const resolveButtons = screen.getAllByRole('button', { name: 'admin.discussions.resolveSwipeAria' })
    fireEvent.click(resolveButtons[resolveButtons.length - 1])
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/discussions/thread-open')
  })

  // TS-Q02 (Must) — fallback-кнопка (без свайпа) → навигация на /admin/discussions/:id.
  it('TS-Q02: fallback-кнопка «Решить» навигирует на тред без свайпа', async () => {
    renderPage()
    await userEvent.click(
      screen.getByRole('button', { name: 'admin.discussions.resolveSwipeAria' }),
    )
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/discussions/thread-open')
  })
})
