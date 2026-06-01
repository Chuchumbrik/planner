import { describe, expect, it } from 'vitest'
import { ideaLinkHref } from './roadmapIdeaStatusMeta'
import type { RoadmapIdeaEntry } from '@/data/productRoadmap'

function idea(partial: Partial<RoadmapIdeaEntry>): RoadmapIdeaEntry {
  return { title: { ru: 't', en: 't' }, summary: { ru: 's', en: 's' }, ...partial }
}

describe('ideaLinkHref', () => {
  it('shipped + linkedVersion → anchor выпуска', () => {
    expect(ideaLinkHref(idea({ status: 'shipped', linkedVersion: '0.7.10' }))).toBe('#v0.7.10')
  })
  it('linkedDiscussion → тред', () => {
    expect(ideaLinkHref(idea({ status: 'in-discussion', linkedDiscussion: 'abc' }))).toBe('/admin/discussions#abc')
  })
  it('shipped без версии или просто proposed → null', () => {
    expect(ideaLinkHref(idea({ status: 'shipped' }))).toBeNull()
    expect(ideaLinkHref(idea({ status: 'proposed' }))).toBeNull()
  })
  it('shipped+version приоритетнее linkedDiscussion', () => {
    expect(ideaLinkHref(idea({ status: 'shipped', linkedVersion: '0.7.0', linkedDiscussion: 'x' }))).toBe('#v0.7.0')
  })
})
