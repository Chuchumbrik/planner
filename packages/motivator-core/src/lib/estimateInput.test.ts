import { describe, expect, it } from 'vitest'
import { mergeEstimateParts, splitEstimateMinutes } from './estimateInput'

describe('mergeEstimateParts', () => {
  // TS-028
  it('оба поля пусты → {total:null, invalid:false}', () => {
    expect(mergeEstimateParts('', '')).toEqual({ total: null, invalid: false })
  })

  // TS-029
  it('ровно 24ч → {total:1440, invalid:false}', () => {
    expect(mergeEstimateParts('24', '0')).toEqual({ total: 1440, invalid: false })
  })

  // TS-030
  it('превышение 24ч → invalid', () => {
    expect(mergeEstimateParts('24', '1')).toEqual({ total: null, invalid: true })
  })

  // TS-031
  it('минуты=60 (вне диапазона) → invalid', () => {
    expect(mergeEstimateParts('0', '60')).toEqual({ total: null, invalid: true })
  })
})

describe('splitEstimateMinutes', () => {
  // TS-032
  it('90 → {hours:"1", minutes:"30"}', () => {
    expect(splitEstimateMinutes(90)).toEqual({ hours: '1', minutes: '30' })
  })
})
