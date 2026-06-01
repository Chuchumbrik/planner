import { describe, expect, it } from 'vitest'
import { formatAdminDateTime } from './formatAdminDate'
import { formatSynced } from './syncStatus'

describe('formatAdminDateTime', () => {
  // TS-094
  it('null → «—»', () => {
    expect(formatAdminDateTime(null, 'ru')).toBe('—')
  })

  // TS-095
  it("'not-a-date' (NaN Date) → «—»", () => {
    expect(formatAdminDateTime('not-a-date', 'ru')).toBe('—')
  })
})

describe('formatSynced', () => {
  // TS-096
  it('null → null', () => {
    expect(formatSynced(null, 'ru')).toBeNull()
  })
})
