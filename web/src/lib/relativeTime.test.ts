import { describe, expect, it } from 'vitest'
import { daysAgo, isFreshRelease, relativeDayLabel } from './relativeTime'

const NOW = new Date('2026-06-01T10:00:00Z')

describe('daysAgo', () => {
  it('считает целые календарные дни по UTC', () => {
    expect(daysAgo('2026-06-01', NOW)).toBe(0)
    expect(daysAgo('2026-05-31', NOW)).toBe(1)
    expect(daysAgo('2026-05-25', NOW)).toBe(7)
    expect(daysAgo('2026-05-02', NOW)).toBe(30)
  })
  it('будущее → отрицательное, мусор → 0', () => {
    expect(daysAgo('2026-06-05', NOW)).toBe(-4)
    expect(daysAgo('не дата', NOW)).toBe(0)
  })
})

describe('isFreshRelease', () => {
  it('свежий только сегодня', () => {
    expect(isFreshRelease('2026-06-01', NOW)).toBe(true)
    expect(isFreshRelease('2026-05-31', NOW)).toBe(false)
  })
})

describe('relativeDayLabel', () => {
  it('ru: пороги и плюрализация', () => {
    expect(relativeDayLabel('2026-06-01', NOW, 'ru')).toBe('сегодня')
    expect(relativeDayLabel('2026-05-31', NOW, 'ru')).toBe('вчера')
    expect(relativeDayLabel('2026-05-29', NOW, 'ru')).toBe('3 дня назад')
    expect(relativeDayLabel('2026-05-26', NOW, 'ru')).toBe('6 дней назад')
    expect(relativeDayLabel('2026-05-18', NOW, 'ru')).toBe('2 недели назад')
    expect(relativeDayLabel('2026-04-22', NOW, 'ru')).toBe('1 месяц назад')
    expect(relativeDayLabel('2026-03-23', NOW, 'ru')).toBe('2 месяца назад')
  })
  it('en: пороги', () => {
    expect(relativeDayLabel('2026-06-01', NOW, 'en')).toBe('today')
    expect(relativeDayLabel('2026-05-31', NOW, 'en')).toBe('yesterday')
    expect(relativeDayLabel('2026-05-29', NOW, 'en')).toBe('3 days ago')
    expect(relativeDayLabel('2026-05-18', NOW, 'en')).toBe('2 weeks ago')
  })
  it('после 90 дней — абсолютная дата', () => {
    expect(relativeDayLabel('2026-01-01', NOW, 'ru')).toBe('2026-01-01')
  })
})
