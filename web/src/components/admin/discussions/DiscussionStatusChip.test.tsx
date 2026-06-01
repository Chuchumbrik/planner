import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DiscussionStatusChip } from './DiscussionStatusChip'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

// ── Группа L — DiscussionStatusChip (§8.4 / §8.6) ────────────────────────────

describe('DiscussionStatusChip — colours & icons', () => {
  // TS-L01 — open → emerald + chat_bubble.
  it('open: emerald chip class and chat_bubble icon', () => {
    const { container } = render(<DiscussionStatusChip status="open" />)
    const chip = container.firstElementChild as HTMLElement
    expect(chip.className).toContain('emerald')
    expect(chip).toHaveTextContent('chat_bubble')
    expect(chip.className).not.toContain('animate-pulse')
  })

  // TS-L02 — pending-journal → animate-pulse + sync_problem.
  it('pending-journal: animate-pulse and sync_problem icon', () => {
    const { container } = render(<DiscussionStatusChip status="pending-journal" />)
    const chip = container.firstElementChild as HTMLElement
    expect(chip.className).toContain('animate-pulse')
    expect(chip).toHaveTextContent('sync_problem')
  })

  // TS-L03 — synced → нет animate-pulse, check_circle.
  it('synced: no animate-pulse and check_circle icon', () => {
    const { container } = render(<DiscussionStatusChip status="synced" />)
    const chip = container.firstElementChild as HTMLElement
    expect(chip.className).not.toContain('animate-pulse')
    expect(chip).toHaveTextContent('check_circle')
  })
})
