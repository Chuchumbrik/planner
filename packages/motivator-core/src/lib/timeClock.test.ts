import { describe, expect, it } from 'vitest'
import { minutesToTimeInput, timeInputToMinutes } from './timeClock'

describe('minutesToTimeInput', () => {
  // TS-022
  it('0 → 00:00', () => {
    expect(minutesToTimeInput(0)).toBe('00:00')
  })

  // TS-023
  it('1439 → 23:59 (граница дня)', () => {
    expect(minutesToTimeInput(1439)).toBe('23:59')
  })

  // TS-024
  it('90 → 01:30', () => {
    expect(minutesToTimeInput(90)).toBe('01:30')
  })
})

describe('timeInputToMinutes', () => {
  // TS-025
  it("'08:30' → 510", () => {
    expect(timeInputToMinutes('08:30')).toBe(510)
  })

  // TS-026
  it("'' → null", () => {
    expect(timeInputToMinutes('')).toBeNull()
  })

  // TS-027
  it("'24:00' → null (> 1439)", () => {
    expect(timeInputToMinutes('24:00')).toBeNull()
  })
})
