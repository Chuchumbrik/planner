import { describe, expect, it } from 'vitest'
import { buildDefectIssueMarkdownPreview } from './defectIssueMarkdownPreview'

const baseInput = {
  description: 'Что-то сломалось',
  appVersion: '0.7.0',
  route: '/app',
}

describe('buildDefectIssueMarkdownPreview', () => {
  // TS-097
  it('пустые опциональные секции не попадают в output', () => {
    const out = buildDefectIssueMarkdownPreview({
      ...baseInput,
      steps: '',
      expected: undefined,
      actual: '',
    })
    expect(out).not.toContain('### Steps to reproduce')
    expect(out).not.toContain('### Expected')
    expect(out).not.toContain('### Actual')
  })

  // TS-098
  it('backtick в userAgent заменяется на одиночную кавычку', () => {
    const out = buildDefectIssueMarkdownPreview({ ...baseInput, userAgent: 'foo`bar' })
    expect(out).toContain("foo'bar")
    expect(out).not.toContain('foo`bar')
  })
})
