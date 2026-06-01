import { describe, expect, it } from 'vitest'
import { computeUnread, DISCUSSION_STATUS_RANK, sortDiscussions } from './discussionSort'
import type { Discussion, DiscussionStatus } from './discussionsApi'

function disc(
  id: string,
  status: DiscussionStatus,
  opts: { last_reply_at?: string | null; created_at?: string } = {},
): Discussion {
  return {
    id,
    title: id,
    status,
    created_at: opts.created_at ?? '2026-01-01T00:00:00.000Z',
    updated_at: opts.created_at ?? '2026-01-01T00:00:00.000Z',
    reply_count: 0,
    last_reply_at: opts.last_reply_at ?? null,
    linked_journal_entry: null,
    linked_version: null,
  }
}

describe('sortDiscussions — status ordering', () => {
  it('orders open → pending-journal → synced → archived', () => {
    const sorted = sortDiscussions([
      disc('archived', 'archived'),
      disc('synced', 'synced'),
      disc('open', 'open'),
      disc('pending', 'pending-journal'),
    ])
    expect(sorted.map((d) => d.id)).toEqual(['open', 'pending', 'synced', 'archived'])
  })

  it('lifts pending-journal above synced/archived', () => {
    const sorted = sortDiscussions([
      disc('synced', 'synced'),
      disc('pending', 'pending-journal'),
    ])
    expect(sorted[0].id).toBe('pending')
  })

  it('rank mapping is monotonic', () => {
    expect(DISCUSSION_STATUS_RANK.open).toBeLessThan(DISCUSSION_STATUS_RANK['pending-journal'])
    expect(DISCUSSION_STATUS_RANK['pending-journal']).toBeLessThan(DISCUSSION_STATUS_RANK.synced)
    expect(DISCUSSION_STATUS_RANK.synced).toBeLessThan(DISCUSSION_STATUS_RANK.archived)
  })
})

describe('sortDiscussions — secondary ordering', () => {
  it('within the same status, newer last_reply_at comes first', () => {
    const sorted = sortDiscussions([
      disc('old', 'open', { last_reply_at: '2026-01-01T00:00:00.000Z' }),
      disc('new', 'open', { last_reply_at: '2026-03-01T00:00:00.000Z' }),
    ])
    expect(sorted.map((d) => d.id)).toEqual(['new', 'old'])
  })

  it('falls back to created_at when last_reply_at is null', () => {
    const sorted = sortDiscussions([
      disc('older', 'open', { last_reply_at: null, created_at: '2026-01-01T00:00:00.000Z' }),
      disc('newer', 'open', { last_reply_at: null, created_at: '2026-02-01T00:00:00.000Z' }),
    ])
    expect(sorted.map((d) => d.id)).toEqual(['newer', 'older'])
  })

  it('does not mutate the input array', () => {
    const input = [disc('a', 'archived'), disc('b', 'open')]
    const copy = [...input]
    sortDiscussions(input)
    expect(input).toEqual(copy)
  })
})

describe('computeUnread', () => {
  it('is false when there is no activity', () => {
    expect(computeUnread(null, null)).toBe(false)
    expect(computeUnread(null, '2026-01-01T00:00:00.000Z')).toBe(false)
  })

  it('is true when there is activity but no read marker', () => {
    expect(computeUnread('2026-01-01T00:00:00.000Z', null)).toBe(true)
  })

  it('is true when last reply is newer than last read', () => {
    expect(computeUnread('2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(true)
  })

  it('is false when last read is at or after last reply', () => {
    expect(computeUnread('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(false)
    expect(computeUnread('2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z')).toBe(false)
  })
})
