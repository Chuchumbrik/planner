import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DiscussionReplyItem } from './DiscussionReplyItem'
import type { DiscussionReply } from '@/lib/discussionsApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

function makeReply(overrides: Partial<DiscussionReply> = {}): DiscussionReply {
  return {
    id: 'r1',
    body: 'тело',
    created_at: '2026-06-01T12:30:00Z',
    created_by: 'u1',
    ...overrides,
  }
}

// ── Группа K — DiscussionReplyItem ───────────────────────────────────────────

describe('DiscussionReplyItem — markdown rendering', () => {
  // TS-K01 — markdown body рендерится через AiMarkdown: **жирный** → <strong>.
  it('renders the markdown body so **bold** becomes a <strong> element', () => {
    const { container } = render(<DiscussionReplyItem reply={makeReply({ body: '**жирный**' })} />)

    const strong = container.querySelector('strong')
    expect(strong).not.toBeNull()
    expect(strong).toHaveTextContent('жирный')
    // Звёздочки не должны попасть в отрендеренный текст.
    expect(screen.queryByText('**жирный**')).not.toBeInTheDocument()
  })
})
