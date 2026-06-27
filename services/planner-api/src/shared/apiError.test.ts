import { describe, expect, it } from 'vitest';
import { apiError, isApiError } from './apiError';

describe('apiError', () => {
  it('carries status and code', () => {
    const err = apiError(403, 'forbidden', 'Not allowed');
    expect(err.status).toBe(403);
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe('Not allowed');
    expect(isApiError(err)).toBe(true);
  });

  it('serializes to client JSON shape', () => {
    const err = apiError(400, 'invalid_body', 'Bad input');
    expect(err.toJSON()).toEqual({ code: 'invalid_body', message: 'Bad input' });
  });
});
