import { describe, expect, it } from 'vitest'
import { monthWeekMatrix, startOfWeekMonday, type MonthMatrixCell } from './calendar'

function dateCells(rows: MonthMatrixCell[][]): string[] {
  return rows.flat().filter((c): c is { dateKey: string } => 'dateKey' in c).map((c) => c.dateKey)
}

describe('startOfWeekMonday', () => {
  // TS-004
  it('понедельник остаётся собой (идемпотентно)', () => {
    expect(startOfWeekMonday('2026-06-01')).toBe('2026-06-01')
  })

  // TS-005
  it('воскресенье → предыдущий понедельник', () => {
    expect(startOfWeekMonday('2026-06-07')).toBe('2026-06-01')
  })
})

describe('monthWeekMatrix', () => {
  // TS-006
  it('февраль 2025 (28 дней): 28 ячеек с датой, pad только по краям', () => {
    const rows = monthWeekMatrix(2025, 1)
    const cells = dateCells(rows)
    expect(cells).toHaveLength(28)
    expect(cells[0]).toBe('2025-02-01')
    expect(cells[27]).toBe('2025-02-28')
    // каждая строка ровно 7 ячеек
    for (const r of rows) expect(r).toHaveLength(7)
  })

  // TS-007
  it('февраль 2024 (29 дней, високос): 29 ячеек с датой', () => {
    const rows = monthWeekMatrix(2024, 1)
    const cells = dateCells(rows)
    expect(cells).toHaveLength(29)
    expect(cells[28]).toBe('2024-02-29')
    for (const r of rows) expect(r).toHaveLength(7)
  })
})
