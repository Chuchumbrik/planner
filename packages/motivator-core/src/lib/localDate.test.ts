import { describe, expect, it } from 'vitest'
import { parseLocalDateKey, shiftLocalDateKey } from './localDate'

describe('parseLocalDateKey', () => {
  // TS-001
  it('парсит валидную строку YYYY-MM-DD', () => {
    const d = parseLocalDateKey('2026-01-15')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2026)
    expect(d!.getMonth()).toBe(0)
    expect(d!.getDate()).toBe(15)
  })

  // TS-002
  it('возвращает null для невалидных форматов и несуществующих дат', () => {
    expect(parseLocalDateKey('abc')).toBeNull()
    expect(parseLocalDateKey('')).toBeNull()
    expect(parseLocalDateKey('2026-13-01')).toBeNull()
    expect(parseLocalDateKey('2026-02-30')).toBeNull()
  })
})

describe('shiftLocalDateKey', () => {
  // TS-003
  it('сдвигает дату через границу года', () => {
    expect(shiftLocalDateKey('2026-12-31', 1)).toBe('2027-01-01')
  })
})
