import { describe, expect, it } from 'vitest'
import {
  MAX_TASK_TITLE_CHARS,
  normalizeEstimatePair,
  sanitizeEstimateHoursInput,
  sanitizeEstimateMinutesInput,
  sanitizeEveryNDaysInput,
  sanitizeTaskTitleInput,
} from './fieldSanitize'

describe('sanitizeEstimateMinutesInput', () => {
  // TS-045
  it("'100' → '59' (clamp к 59)", () => {
    expect(sanitizeEstimateMinutesInput('100')).toBe('59')
  })

  // TS-046
  it("'' → '' (пустой ввод сохраняется)", () => {
    expect(sanitizeEstimateMinutesInput('')).toBe('')
  })
})

describe('sanitizeEstimateHoursInput', () => {
  // TS-047
  it("('25','0') → '24' (max при 0 мин)", () => {
    expect(sanitizeEstimateHoursInput('25', '0')).toBe('24')
  })

  // TS-048
  it("('24','30') → '23' (24ч 30мин > 1440)", () => {
    expect(sanitizeEstimateHoursInput('24', '30')).toBe('23')
  })
})

describe('normalizeEstimatePair', () => {
  // TS-049
  it("нечисловые часы ('abc','60') → {hours:'', minutes:'59'}", () => {
    expect(normalizeEstimatePair('abc', '60')).toEqual({ hours: '', minutes: '59' })
  })

  // TS-050
  it('идемпотентность: повторный вызов не меняет значения', () => {
    const once = normalizeEstimatePair('24', '30')
    const twice = normalizeEstimatePair(once.hours, once.minutes)
    expect(twice).toEqual(once)
  })
})

describe('sanitizeTaskTitleInput', () => {
  // TS-051
  it('обрезка строки 501 символ → 500', () => {
    const long = 'a'.repeat(501)
    expect(sanitizeTaskTitleInput(long)).toHaveLength(MAX_TASK_TITLE_CHARS)
  })

  // TS-052
  it("обычная строка без управляющих символов → без изменений", () => {
    expect(sanitizeTaskTitleInput('hello')).toBe('hello')
  })
})

describe('sanitizeEveryNDaysInput', () => {
  // TS-053
  it("'367' → 366 (MAX_EVERY_N_DAYS)", () => {
    expect(sanitizeEveryNDaysInput('367')).toBe(366)
  })

  // TS-054
  it("'0' → 1 (минимум)", () => {
    expect(sanitizeEveryNDaysInput('0')).toBe(1)
  })
})
