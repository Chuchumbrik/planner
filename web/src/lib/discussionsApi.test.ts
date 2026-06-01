import { describe, it, expect } from 'vitest'
import { isStaleStatusError, DISCUSSIONS_FN } from './discussionsApi'

describe('isStaleStatusError', () => {
  it('returns true when the message carries the backend bad_status code', () => {
    // Shape produced by formatSupabaseFunctionInvokeError for a 409.
    expect(isStaleStatusError('Edge Function returned a non-2xx status code — bad_status')).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isStaleStatusError('network error')).toBe(false)
    expect(isStaleStatusError('admin_only')).toBe(false)
    expect(isStaleStatusError('not_found')).toBe(false)
  })

  it('returns false for null/undefined/empty', () => {
    expect(isStaleStatusError(null)).toBe(false)
    expect(isStaleStatusError(undefined)).toBe(false)
    expect(isStaleStatusError('')).toBe(false)
  })
})

describe('DISCUSSIONS_FN', () => {
  it('matches the deployed Edge function slug', () => {
    expect(DISCUSSIONS_FN).toBe('admin-discussions')
  })
})
