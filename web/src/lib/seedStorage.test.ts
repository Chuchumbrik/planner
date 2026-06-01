import { beforeEach, describe, expect, it } from 'vitest'
import {
  MOTIVATOR_SEED_STORAGE_KEY,
  MOTIVATOR_SEED_WARNING_ACK_KEY,
  getStoredSeedB64,
  hasAcknowledgedSeedWarning,
} from './seedStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('getStoredSeedB64', () => {
  // TS-092
  it('пробельная строка → null', () => {
    localStorage.setItem(MOTIVATOR_SEED_STORAGE_KEY, '   ')
    expect(getStoredSeedB64()).toBeNull()
  })
})

describe('hasAcknowledgedSeedWarning', () => {
  // TS-093
  it("'1' → true; нет записи → false", () => {
    expect(hasAcknowledgedSeedWarning()).toBe(false)
    localStorage.setItem(MOTIVATOR_SEED_WARNING_ACK_KEY, '1')
    expect(hasAcknowledgedSeedWarning()).toBe(true)
  })
})
