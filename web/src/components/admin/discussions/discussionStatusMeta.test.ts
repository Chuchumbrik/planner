import { describe, it, expect } from 'vitest'
import { DISCUSSION_STATUS_META } from './discussionStatusMeta'

// Группа A — таблица констант DISCUSSION_STATUS_META (§8.4 / §8.6).
// Чистый unit без зависимостей.

describe('DISCUSSION_STATUS_META', () => {
  // TS-A01 — все 4 статуса присутствуют.
  it('contains exactly the 4 known statuses', () => {
    expect(Object.keys(DISCUSSION_STATUS_META).sort()).toEqual(
      ['archived', 'open', 'pending-journal', 'synced'].sort(),
    )
  })

  // TS-A02 — open: emerald + chat_bubble.
  it('open → emerald chip, chat_bubble icon, statusOpen label', () => {
    const meta = DISCUSSION_STATUS_META['open']
    expect(meta.chipClass).toContain('emerald')
    expect(meta.icon).toBe('chat_bubble')
    expect(meta.labelKey).toBe('admin.discussions.statusOpen')
  })

  // TS-A03 — pending-journal: amber + animate-pulse + sync_problem.
  it('pending-journal → amber chip with animate-pulse, sync_problem icon, statusPending label', () => {
    const meta = DISCUSSION_STATUS_META['pending-journal']
    expect(meta.chipClass).toContain('amber')
    expect(meta.chipClass).toContain('animate-pulse')
    expect(meta.icon).toBe('sync_problem')
    expect(meta.labelKey).toBe('admin.discussions.statusPending')
  })

  // TS-A04 — synced: check_circle, без animate-pulse.
  it('synced → check_circle icon, statusSynced label, no animate-pulse', () => {
    const meta = DISCUSSION_STATUS_META['synced']
    expect(meta.chipClass).not.toContain('animate-pulse')
    expect(meta.icon).toBe('check_circle')
    expect(meta.labelKey).toBe('admin.discussions.statusSynced')
  })

  // TS-A05 — archived: zinc + archive.
  it('archived → zinc chip, archive icon, statusArchived label', () => {
    const meta = DISCUSSION_STATUS_META['archived']
    expect(meta.chipClass).toContain('zinc')
    expect(meta.icon).toBe('archive')
    expect(meta.labelKey).toBe('admin.discussions.statusArchived')
  })

  // TS-A06 — animate-pulse только у pending-journal.
  it('pending-journal is the only status carrying animate-pulse', () => {
    const withPulse = Object.entries(DISCUSSION_STATUS_META)
      .filter(([, meta]) => meta.chipClass.includes('animate-pulse'))
      .map(([status]) => status)
    expect(withPulse).toEqual(['pending-journal'])
  })
})
