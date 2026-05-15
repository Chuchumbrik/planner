import { describe, expect, it } from 'vitest'
import {
  humanizeConnectivityError,
  isLikelyNetworkFetchFailure,
} from './connectivityHints'

describe('isLikelyNetworkFetchFailure', () => {
  it('detects common fetch failures', () => {
    expect(isLikelyNetworkFetchFailure('TypeError: Failed to fetch')).toBe(true)
    expect(isLikelyNetworkFetchFailure('Load failed')).toBe(true)
    expect(isLikelyNetworkFetchFailure('NetworkError when attempting to fetch resource.')).toBe(
      true,
    )
  })

  it('ignores unrelated errors', () => {
    expect(isLikelyNetworkFetchFailure('Invalid login credentials')).toBe(false)
    expect(isLikelyNetworkFetchFailure(null)).toBe(false)
  })
})

describe('humanizeConnectivityError', () => {
  const t = (key: string) => (key === 'app.syncErrorGeneric' ? 'Network generic' : key)

  it('returns generic message for network-like errors', () => {
    expect(humanizeConnectivityError('Failed to fetch', t)).toBe('Network generic')
  })

  it('passes through other messages', () => {
    expect(humanizeConnectivityError('Wrong password', t)).toBe('Wrong password')
  })
})
